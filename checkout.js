// 顯示結帳表單
function showCheckoutForm() {
    if (cart.length === 0) {
        alert('購物車是空的！');
        return;
    }

    // 驗證購物車
    const cartValidation = SecuritySystem.validateCart(cart);
    if (!cartValidation.valid) {
        alert('購物車驗證失敗：\n' + cartValidation.errors.join('\n'));
        return;
    }

    // 驗證訂單金額
    const total = getCartTotal();
    const amountValidation = SecuritySystem.validateOrderAmount(total);
    if (!amountValidation.valid) {
        alert(amountValidation.message);
        return;
    }

    const modal = document.getElementById('checkout-modal');
    const summaryContainer = document.getElementById('order-summary-items');
    const orderTotal = document.getElementById('order-total');

    // 更新訂單摘要
    summaryContainer.innerHTML = '';
    cart.forEach(item => {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'order-summary-item';
        summaryItem.innerHTML = `
            <span>${item.name} (${item.size}) x ${item.quantity}</span>
            <span>NT$ ${(item.price * item.quantity).toLocaleString()}</span>
        `;
        summaryContainer.appendChild(summaryItem);
    });

    orderTotal.textContent = `NT$ ${total.toLocaleString()}`;

    // 自動填入會員資料
    if (typeof autoFillCheckoutForm === 'function') {
        autoFillCheckoutForm();
    }

    // 生成並顯示驗證碼
    refreshCaptcha();

    modal.classList.add('active');
}

// 關閉結帳表單
function closeCheckoutForm() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('active');
}

// 提交訂單
async function submitOrder(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');

    // 1. 驗證驗證碼
    const captchaAnswer = document.getElementById('captcha-answer').value;
    const captchaValidation = CaptchaSystem.verify(captchaAnswer);

    if (!captchaValidation.valid) {
        alert(captchaValidation.message);
        refreshCaptcha();
        return;
    }

    // 2. 檢查訂單頻率限制
    const rateLimitCheck = SecuritySystem.checkOrderRateLimit();
    if (!rateLimitCheck.allowed) {
        alert(rateLimitCheck.message);
        SecuritySystem.logSuspiciousActivity('RATE_LIMIT_EXCEEDED');
        return;
    }

    // 3. 取得並清理客戶資料
    const rawCustomerData = {
        name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value,
        address: document.getElementById('customer-address').value,
        note: document.getElementById('customer-note').value
    };

    // 4. 驗證客戶資料
    const customerValidation = SecuritySystem.validateCustomerData(rawCustomerData);
    if (!customerValidation.valid) {
        alert('資料驗證失敗：\n' + customerValidation.errors.join('\n'));
        return;
    }

    // 5. 清理客戶資料（防止 XSS）
    const cleanCustomerData = SecuritySystem.sanitizeCustomerData(rawCustomerData);

    // 6. 再次驗證購物車
    const cartValidation = SecuritySystem.validateCart(cart);
    if (!cartValidation.valid) {
        alert('購物車驗證失敗：\n' + cartValidation.errors.join('\n'));
        return;
    }

    // 7. 建立訂單資料
    const orderData = {
        orderNumber: generateOrderNumber(),
        timestamp: new Date().toISOString(),
        deviceId: SecuritySystem.getDeviceFingerprint(),
        customer: cleanCustomerData,
        items: getCartSummary(),
        total: getCartTotal(),
        paymentMethod: selectedPaymentMethod || 'COD'
    };

    // 🔍 Debug: 顯示訂單資料（測試時使用）
    console.log('📦 訂單資料：', JSON.stringify(orderData, null, 2));

    // 8. 檢測可疑訂單
    const suspiciousCheck = SecuritySystem.detectSuspiciousOrder(orderData);
    if (suspiciousCheck.isSuspicious) {
        console.warn('可疑訂單：', suspiciousCheck.flags);
        SecuritySystem.logSuspiciousActivity({
            type: 'SUSPICIOUS_ORDER',
            flags: suspiciousCheck.flags,
            orderNumber: orderData.orderNumber
        });

        // 高風險訂單需要額外確認
        if (suspiciousCheck.riskLevel === 'high') {
            const confirmed = confirm(
                '您的訂單被標記為需要人工審核：\n' +
                suspiciousCheck.flags.join('\n') +
                '\n\n是否確定要繼續提交？'
            );

            if (!confirmed) {
                return;
            }
        }
    }

    // 9. 顯示提交中狀態
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;

    try {
        // 10. 處理付款
        const paymentResult = await PaymentSystem.processPayment(
            selectedPaymentMethod,
            orderData
        );

        if (!paymentResult.success) {
            throw new Error(paymentResult.message || '付款處理失敗');
        }

        orderData.paymentInfo = paymentResult.paymentInfo;

        // 11. 提交訂單到 Google Sheets
        await submitToGoogleSheets(orderData);

        // 12. 記錄訂單提交
        SecuritySystem.recordOrderSubmission();

        // 13. 更新會員資料（如果有登入）
        if (typeof MemberSystem !== 'undefined' && MemberSystem.getCurrentMember()) {
            const earnedPoints = MemberSystem.updateMemberAfterOrder(
                orderData.orderNumber,
                orderData.total
            );

            if (earnedPoints > 0) {
                orderData.earnedPoints = earnedPoints;
            }
        }

        // 14. 新增到訂單追蹤系統
        if (typeof OrderTracking !== 'undefined') {
            OrderTracking.addOrder(orderData.orderNumber, orderData);
        }

        // 15. 顯示成功訊息
        showSuccessModal(orderData.orderNumber, orderData.paymentInfo);

        // 16. 清空購物車
        clearCart();

        // 17. 重設表單
        document.getElementById('checkout-form').reset();

        // 18. 關閉結帳表單
        closeCheckoutForm();

    } catch (error) {
        console.error('訂單提交失敗：', error);
        alert('訂單提交失敗：' + error.message + '\n請稍後再試或聯繫客服。');

        SecuritySystem.logSuspiciousActivity({
            type: 'ORDER_SUBMISSION_ERROR',
            error: error.message,
            orderNumber: orderData.orderNumber
        });

    } finally {
        submitBtn.textContent = '送出訂單';
        submitBtn.disabled = false;
    }
}

// 生成訂單編號
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
}

// 提交到 Google Sheets
async function submitToGoogleSheets(orderData) {
    // Google Apps Script Web App URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsfmnuBFP1cnhyOBdgG0MnH0MoL0RThKSwZgL7jUsmPx8EjFwWi5hPE8NeFrdDUeA/exec';

    // 如果尚未設定 Google Apps Script URL，暫時儲存到 localStorage
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('訂單資料（開發模式）：', orderData);
        saveOrderToLocalStorage(orderData);
        return;
    }

    try {
        // 🔍 Debug: 顯示實際送出的資料
        console.log('🚀 準備送出訂單：');
        console.log('📦 完整訂單資料：', JSON.stringify(orderData, null, 2));
        console.log('🛒 商品清單：', orderData.items);
        console.log('👤 客戶資料：', orderData.customer);

        // 實際提交到 Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(orderData)
        });

        // 讀取回應
        const result = await response.text();
        console.log('Google Sheets 回應：', result);

        // 檢查是否成功
        let responseData;
        try {
            responseData = JSON.parse(result);
        } catch (e) {
            // 如果回應不是 JSON，可能是重導向的 HTML
            console.warn('無法解析回應，訂單可能已送出');
            responseData = { status: 'unknown' };
        }

        if (responseData.status === 'error') {
            throw new Error(responseData.message || '訂單提交失敗');
        }

        console.log('✅ 訂單已成功送出到 Google Sheets');

        // 同時也儲存到本地作為備份
        saveOrderToLocalStorage(orderData);

    } catch (error) {
        console.error('❌ 提交失敗：', error);

        // 儲存到本地作為備份
        saveOrderToLocalStorage(orderData);

        // 如果是網路錯誤，仍然讓訂單繼續（資料已存到本地）
        console.warn('訂單已暫存到本地，請聯繫客服確認');

        // 不拋出錯誤，讓流程繼續
    }
}

// 開發模式：暫存訂單到 localStorage
function saveOrderToLocalStorage(orderData) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    console.log('訂單已暫存到 localStorage，總共', orders.length, '筆訂單');
}

// 顯示成功訊息
function showSuccessModal(orderNumber) {
    const modal = document.getElementById('success-modal');
    document.getElementById('order-number').textContent = orderNumber;
    modal.classList.add('active');

    // 關閉購物車側邊欄
    document.getElementById('cart-sidebar').classList.remove('active');
}

// 關閉成功訊息
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
}

// 重新整理驗證碼
function refreshCaptcha() {
    const captchaElement = document.getElementById('captcha-question');
    if (captchaElement) {
        captchaElement.textContent = CaptchaSystem.display();
    }

    const answerElement = document.getElementById('captcha-answer');
    if (answerElement) {
        answerElement.value = '';
    }
}

// 取得所有訂單（開發用）
function getAllOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    console.table(orders);
    return orders;
}

// 匯出訂單為 CSV（開發用）
function exportOrdersToCSV() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (orders.length === 0) {
        alert('沒有訂單資料');
        return;
    }

    let csv = '訂單編號,日期時間,客戶姓名,電話,Email,地址,商品明細,總金額,備註\n';

    orders.forEach(order => {
        const itemsText = order.items.map(item =>
            `${item.name}(${item.size})x${item.quantity}`
        ).join('; ');

        const row = [
            order.orderNumber,
            new Date(order.timestamp).toLocaleString('zh-TW'),
            order.customer.name,
            order.customer.phone,
            order.customer.email,
            order.customer.address,
            itemsText,
            order.total,
            order.customer.note
        ].map(field => `"${field}"`).join(',');

        csv += row + '\n';
    });

    // 下載 CSV
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

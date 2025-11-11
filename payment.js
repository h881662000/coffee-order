// 付款方式系統

// 付款方式選項
const PAYMENT_METHODS = {
    COD: {
        id: 'COD',
        name: '貨到付款',
        icon: '💵',
        description: '商品送達時以現金付款',
        fee: 30,
        enabled: true
    },
    TRANSFER: {
        id: 'TRANSFER',
        name: '銀行轉帳',
        icon: '🏦',
        description: '轉帳後請提供後五碼以便核對',
        fee: 0,
        enabled: true,
        bankInfo: {
            bank: '台灣銀行',
            branch: '信義分行',
            account: '123-456-789012',
            accountName: 'DiDo咖啡'
        }
    },
    CREDIT_CARD: {
        id: 'CREDIT_CARD',
        name: '信用卡',
        icon: '💳',
        description: '安全的線上刷卡服務',
        fee: 0,
        enabled: true,
        note: '支援 Visa、MasterCard、JCB'
    },
    LINE_PAY: {
        id: 'LINE_PAY',
        name: 'LINE Pay',
        icon: '🟢',
        description: '使用 LINE Pay 快速付款',
        fee: 0,
        enabled: true
    },
    JKOPAY: {
        id: 'JKOPAY',
        name: '街口支付',
        icon: '🟠',
        description: '使用街口支付輕鬆付款',
        fee: 0,
        enabled: true
    },
    ATM: {
        id: 'ATM',
        name: 'ATM 虛擬帳號',
        icon: '🏧',
        description: '系統將提供專屬虛擬帳號',
        fee: 10,
        enabled: true
    }
};

// 付款管理系統
const PaymentSystem = {
    // 取得可用的付款方式
    getAvailableMethods() {
        return Object.values(PAYMENT_METHODS).filter(method => method.enabled);
    },

    // 取得付款方式資訊
    getMethod(methodId) {
        return PAYMENT_METHODS[methodId] || null;
    },

    // 計算付款手續費
    calculateFee(methodId) {
        const method = this.getMethod(methodId);
        return method ? method.fee : 0;
    },

    // 生成虛擬帳號（ATM用）
    generateVirtualAccount() {
        const prefix = '9985';
        const random = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        return prefix + random;
    },

    // 生成轉帳驗證碼（銀行轉帳用）
    generateTransferCode() {
        return Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    },

    // 處理付款（模擬）
    async processPayment(methodId, orderData) {
        const method = this.getMethod(methodId);
        if (!method) {
            return { success: false, message: '無效的付款方式' };
        }

        // 模擬付款處理
        await new Promise(resolve => setTimeout(resolve, 1500));

        let paymentInfo = {
            method: methodId,
            methodName: method.name,
            fee: method.fee,
            timestamp: new Date().toISOString()
        };

        switch (methodId) {
            case 'ATM':
                paymentInfo.virtualAccount = this.generateVirtualAccount();
                paymentInfo.dueDate = this.getPaymentDueDate(3);
                break;

            case 'TRANSFER':
                paymentInfo.transferCode = this.generateTransferCode();
                paymentInfo.bankInfo = method.bankInfo;
                paymentInfo.dueDate = this.getPaymentDueDate(3);
                break;

            case 'COD':
                paymentInfo.note = '請準備現金，送達時付款';
                break;

            case 'CREDIT_CARD':
            case 'LINE_PAY':
            case 'JKOPAY':
                paymentInfo.transactionId = this.generateTransactionId();
                paymentInfo.status = 'paid';
                break;
        }

        return {
            success: true,
            paymentInfo: paymentInfo
        };
    },

    // 取得付款期限
    getPaymentDueDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    },

    // 生成交易編號
    generateTransactionId() {
        return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    }
};

// 當前選擇的付款方式
let selectedPaymentMethod = 'COD';

// 渲染付款方式選項
function renderPaymentMethods() {
    const container = document.getElementById('payment-methods');
    if (!container) return;

    const methods = PaymentSystem.getAvailableMethods();

    container.innerHTML = methods.map(method => `
        <div class="payment-method-card ${selectedPaymentMethod === method.id ? 'selected' : ''}"
             onclick="selectPaymentMethod('${method.id}')">
            <div class="payment-icon">${method.icon}</div>
            <div class="payment-info">
                <div class="payment-name">${method.name}</div>
                <div class="payment-description">${method.description}</div>
                ${method.fee > 0 ? `<div class="payment-fee">手續費 NT$ ${method.fee}</div>` : ''}
            </div>
            <div class="payment-radio">
                <input type="radio" name="payment" value="${method.id}"
                       ${selectedPaymentMethod === method.id ? 'checked' : ''}
                       onchange="selectPaymentMethod('${method.id}')">
            </div>
        </div>
    `).join('');
}

// 選擇付款方式
function selectPaymentMethod(methodId) {
    selectedPaymentMethod = methodId;
    renderPaymentMethods();
    updatePaymentFee();
}

// 更新付款手續費
function updatePaymentFee() {
    const fee = PaymentSystem.calculateFee(selectedPaymentMethod);
    const feeElement = document.getElementById('payment-fee');

    if (feeElement) {
        feeElement.textContent = fee > 0 ? `NT$ ${fee}` : '免手續費';
    }

    // 重新計算總金額
    if (typeof updateOrderTotalWithCoupon === 'function') {
        updateOrderTotalWithCoupon();
    }
}

// 顯示付款資訊（訂單完成後）
function showPaymentInfo(paymentInfo) {
    let html = '<div class="payment-info-section">';

    html += `<h3>付款方式：${paymentInfo.methodName}</h3>`;

    switch (paymentInfo.method) {
        case 'ATM':
            html += `
                <div class="payment-details">
                    <p class="highlight">請於 ${new Date(paymentInfo.dueDate).toLocaleDateString('zh-TW')} 前完成付款</p>
                    <div class="virtual-account">
                        <p><strong>銀行代碼：</strong>998（臺灣工銀）</p>
                        <p><strong>虛擬帳號：</strong><span class="account-number">${paymentInfo.virtualAccount}</span></p>
                        <p><strong>付款金額：</strong>NT$ ${paymentInfo.amount}</p>
                    </div>
                    <p class="payment-note">⚠️ 請務必使用正確的虛擬帳號轉帳，轉帳後系統將自動確認</p>
                </div>
            `;
            break;

        case 'TRANSFER':
            html += `
                <div class="payment-details">
                    <p class="highlight">請於 ${new Date(paymentInfo.dueDate).toLocaleDateString('zh-TW')} 前完成轉帳</p>
                    <div class="bank-info">
                        <p><strong>銀行：</strong>${paymentInfo.bankInfo.bank}</p>
                        <p><strong>分行：</strong>${paymentInfo.bankInfo.branch}</p>
                        <p><strong>帳號：</strong><span class="account-number">${paymentInfo.bankInfo.account}</span></p>
                        <p><strong>戶名：</strong>${paymentInfo.bankInfo.accountName}</p>
                        <p><strong>金額：</strong>NT$ ${paymentInfo.amount}</p>
                    </div>
                    <div class="transfer-code">
                        <p><strong>轉帳驗證碼：</strong><span class="code">${paymentInfo.transferCode}</span></p>
                        <p class="payment-note">⚠️ 轉帳完成後，請告知我們帳號後五碼以便核對</p>
                    </div>
                </div>
            `;
            break;

        case 'COD':
            html += `
                <div class="payment-details">
                    <p>${paymentInfo.note}</p>
                    <p><strong>應付金額：</strong>NT$ ${paymentInfo.amount}</p>
                    <p class="payment-note">💡 請準備零錢，以便快速完成交易</p>
                </div>
            `;
            break;

        case 'CREDIT_CARD':
        case 'LINE_PAY':
        case 'JKOPAY':
            html += `
                <div class="payment-details">
                    <p class="success-message">✓ 付款成功！</p>
                    <p><strong>交易編號：</strong>${paymentInfo.transactionId}</p>
                    <p><strong>付款金額：</strong>NT$ ${paymentInfo.amount}</p>
                    <p class="payment-note">付款憑證已發送至您的 Email</p>
                </div>
            `;
            break;
    }

    html += '</div>';

    return html;
}

// 初始化付款方式
document.addEventListener('DOMContentLoaded', () => {
    renderPaymentMethods();
});

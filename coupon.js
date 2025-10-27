// 優惠券系統

// 優惠券類型
const COUPON_TYPE = {
    PERCENTAGE: 'percentage',  // 百分比折扣
    FIXED: 'fixed',            // 固定金額折扣
    SHIPPING: 'shipping'       // 免運費
};

// 優惠券資料
const availableCoupons = [
    {
        code: 'WELCOME100',
        name: '新會員優惠',
        type: COUPON_TYPE.FIXED,
        value: 100,
        minAmount: 500,
        maxDiscount: 100,
        expiryDate: '2025-12-31',
        description: '新會員專享，滿 NT$ 500 折 NT$ 100'
    },
    {
        code: 'COFFEE20',
        name: '咖啡節優惠',
        type: COUPON_TYPE.PERCENTAGE,
        value: 20,
        minAmount: 1000,
        maxDiscount: 500,
        expiryDate: '2025-12-31',
        description: '滿 NT$ 1000 享 8 折優惠（最高折抵 NT$ 500）'
    },
    {
        code: 'FREESHIP',
        name: '免運優惠',
        type: COUPON_TYPE.SHIPPING,
        value: 60,
        minAmount: 800,
        maxDiscount: 60,
        expiryDate: '2025-12-31',
        description: '滿 NT$ 800 免運費'
    },
    {
        code: 'VIP15',
        name: 'VIP 專屬優惠',
        type: COUPON_TYPE.PERCENTAGE,
        value: 15,
        minAmount: 1500,
        maxDiscount: 1000,
        expiryDate: '2025-12-31',
        description: 'VIP 會員專享，滿 NT$ 1500 享 85 折'
    }
];

// 優惠券管理系統
const CouponSystem = {
    // 驗證優惠券
    validateCoupon(code, orderTotal) {
        const coupon = availableCoupons.find(c => c.code === code.toUpperCase());

        if (!coupon) {
            return { valid: false, message: '優惠券代碼無效' };
        }

        // 檢查是否過期
        if (new Date(coupon.expiryDate) < new Date()) {
            return { valid: false, message: '優惠券已過期' };
        }

        // 檢查最低消費金額
        if (orderTotal < coupon.minAmount) {
            return {
                valid: false,
                message: `此優惠券需消費滿 NT$ ${coupon.minAmount.toLocaleString()}`
            };
        }

        // 檢查是否已使用
        if (this.isCouponUsed(code)) {
            return { valid: false, message: '此優惠券已使用過' };
        }

        return {
            valid: true,
            coupon: coupon,
            discount: this.calculateDiscount(coupon, orderTotal)
        };
    },

    // 計算折扣金額
    calculateDiscount(coupon, orderTotal) {
        let discount = 0;

        switch (coupon.type) {
            case COUPON_TYPE.PERCENTAGE:
                discount = Math.floor(orderTotal * (coupon.value / 100));
                break;
            case COUPON_TYPE.FIXED:
                discount = coupon.value;
                break;
            case COUPON_TYPE.SHIPPING:
                discount = coupon.value;
                break;
        }

        // 不超過最大折扣金額
        return Math.min(discount, coupon.maxDiscount);
    },

    // 檢查優惠券是否已使用
    isCouponUsed(code) {
        const usedCoupons = JSON.parse(localStorage.getItem('usedCoupons') || '[]');
        return usedCoupons.includes(code.toUpperCase());
    },

    // 標記優惠券已使用
    markCouponAsUsed(code) {
        let usedCoupons = JSON.parse(localStorage.getItem('usedCoupons') || '[]');
        usedCoupons.push(code.toUpperCase());
        localStorage.setItem('usedCoupons', JSON.stringify(usedCoupons));
    },

    // 取得可用的優惠券列表
    getAvailableCoupons(orderTotal = 0) {
        return availableCoupons.filter(coupon => {
            const notExpired = new Date(coupon.expiryDate) >= new Date();
            const notUsed = !this.isCouponUsed(coupon.code);
            const meetsMinAmount = orderTotal >= coupon.minAmount;

            return notExpired && notUsed && (orderTotal === 0 || meetsMinAmount);
        });
    },

    // 取得會員點數可兌換的優惠券
    getPointExchangeCoupons() {
        return [
            {
                code: 'POINTS50',
                name: '50 點折價券',
                type: COUPON_TYPE.FIXED,
                value: 50,
                minAmount: 500,
                maxDiscount: 50,
                pointsCost: 50,
                description: '兌換 50 點獲得 NT$ 50 折價券'
            },
            {
                code: 'POINTS100',
                name: '100 點折價券',
                type: COUPON_TYPE.FIXED,
                value: 100,
                minAmount: 800,
                maxDiscount: 100,
                pointsCost: 100,
                description: '兌換 100 點獲得 NT$ 100 折價券'
            },
            {
                code: 'POINTS200',
                name: '200 點折價券',
                type: COUPON_TYPE.FIXED,
                value: 200,
                minAmount: 1500,
                maxDiscount: 200,
                pointsCost: 200,
                description: '兌換 200 點獲得 NT$ 200 折價券'
            }
        ];
    },

    // 用點數兌換優惠券
    exchangePointsForCoupon(couponCode) {
        const member = MemberSystem.getCurrentMember();
        if (!member) {
            return { success: false, message: '請先登入會員' };
        }

        const exchangeCoupon = this.getPointExchangeCoupons().find(c => c.code === couponCode);
        if (!exchangeCoupon) {
            return { success: false, message: '找不到此兌換券' };
        }

        if (member.points < exchangeCoupon.pointsCost) {
            return { success: false, message: '點數不足' };
        }

        // 扣除點數
        if (MemberSystem.usePoints(exchangeCoupon.pointsCost)) {
            // 新增到可用優惠券
            availableCoupons.push({
                ...exchangeCoupon,
                expiryDate: this.getExchangeCouponExpiry(),
                isExchanged: true
            });

            return {
                success: true,
                message: `成功兌換 ${exchangeCoupon.name}！`,
                coupon: exchangeCoupon
            };
        }

        return { success: false, message: '兌換失敗' };
    },

    // 取得兌換優惠券的有效期限（30天）
    getExchangeCouponExpiry() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }
};

// 當前使用的優惠券
let appliedCoupon = null;
let currentShippingFee = 60; // 預設運費

// 套用優惠券
function applyCoupon() {
    const couponCode = document.getElementById('coupon-code').value.trim();

    if (!couponCode) {
        alert('請輸入優惠券代碼');
        return;
    }

    const orderTotal = getCartTotal();
    const validation = CouponSystem.validateCoupon(couponCode, orderTotal);

    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    appliedCoupon = {
        code: validation.coupon.code,
        discount: validation.discount,
        type: validation.coupon.type
    };

    updateOrderTotalWithCoupon();
    alert(`優惠券已套用！折扣 NT$ ${validation.discount}`);
}

// 移除優惠券
function removeCoupon() {
    appliedCoupon = null;
    document.getElementById('coupon-code').value = '';
    updateOrderTotalWithCoupon();
}

// 更新訂單總額（含優惠券折扣）
function updateOrderTotalWithCoupon() {
    const subtotal = getCartTotal();
    const shippingFee = appliedCoupon && appliedCoupon.type === COUPON_TYPE.SHIPPING ? 0 : currentShippingFee;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;

    // 會員折扣
    const member = MemberSystem.getCurrentMember();
    let memberDiscount = 0;
    if (member) {
        const levelInfo = MemberSystem.getLevelInfo(member.level);
        memberDiscount = Math.floor(subtotal * levelInfo.discount);
    }

    const total = subtotal + shippingFee - discount - memberDiscount;

    // 更新顯示
    const summaryHTML = `
        <div class="price-row">
            <span>小計</span>
            <span>NT$ ${subtotal.toLocaleString()}</span>
        </div>
        ${memberDiscount > 0 ? `
            <div class="price-row discount">
                <span>會員折扣</span>
                <span>-NT$ ${memberDiscount.toLocaleString()}</span>
            </div>
        ` : ''}
        ${appliedCoupon ? `
            <div class="price-row discount">
                <span>優惠券折扣 (${appliedCoupon.code})</span>
                <span>-NT$ ${discount.toLocaleString()}</span>
                <button onclick="removeCoupon()" class="remove-coupon-btn">✕</button>
            </div>
        ` : ''}
        <div class="price-row">
            <span>運費</span>
            <span>${shippingFee === 0 ? '免運' : 'NT$ ' + shippingFee}</span>
        </div>
        <div class="price-row total">
            <strong>總計</strong>
            <strong>NT$ ${total.toLocaleString()}</strong>
        </div>
    `;

    const summaryElement = document.getElementById('order-price-summary');
    if (summaryElement) {
        summaryElement.innerHTML = summaryHTML;
    }

    return total;
}

// 顯示可用優惠券列表
function showAvailableCoupons() {
    const modal = document.getElementById('coupons-modal');
    if (!modal) return;

    const orderTotal = getCartTotal();
    const coupons = CouponSystem.getAvailableCoupons(orderTotal);

    const couponsHTML = coupons.map(coupon => {
        const canUse = orderTotal >= coupon.minAmount;
        const discount = CouponSystem.calculateDiscount(coupon, orderTotal);

        return `
            <div class="coupon-card ${canUse ? '' : 'disabled'}">
                <div class="coupon-header">
                    <div class="coupon-name">${coupon.name}</div>
                    <div class="coupon-value">
                        ${coupon.type === COUPON_TYPE.PERCENTAGE ? `${coupon.value}% OFF` : `NT$ ${coupon.value}`}
                    </div>
                </div>
                <div class="coupon-description">${coupon.description}</div>
                <div class="coupon-footer">
                    <span class="coupon-code">${coupon.code}</span>
                    ${canUse ? `
                        <button onclick="useCouponFromList('${coupon.code}')" class="use-coupon-btn">
                            使用
                        </button>
                    ` : `
                        <span class="coupon-disabled">不符合使用條件</span>
                    `}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('coupons-list').innerHTML = couponsHTML || '<p class="no-coupons">目前沒有可用的優惠券</p>';
    modal.classList.add('active');
}

// 從列表使用優惠券
function useCouponFromList(code) {
    document.getElementById('coupon-code').value = code;
    applyCoupon();
    closeCouponsModal();
}

// 關閉優惠券列表
function closeCouponsModal() {
    const modal = document.getElementById('coupons-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

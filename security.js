// 安全性與防護機制

// 預設安全設定
const DEFAULT_SECURITY_CONFIG = {
    // 訂單頻率限制
    ORDER_RATE_LIMIT: {
        maxOrders: 999,              // 最大訂單數
        timeWindow: 36000000,       // 時間窗口（毫秒）
        blockDuration: 1    // 封鎖時長（毫秒）
    },

    // 購物車限制
    CART_LIMITS: {
        maxItems: 20,              // 最大商品種類
        maxQuantityPerItem: 10,    // 單一商品最大數量
        maxTotalQuantity: 50       // 購物車總數量上限
    },

    // 訂單金額限制
    ORDER_LIMITS: {
        minAmount: 100,            // 最低訂單金額
        maxAmount: 50000,          // 最高訂單金額（防異常大額訂單）
        maxItemPrice: 10000        // 單一商品最高價格
    },

    // IP/裝置限制
    DEVICE_LIMITS: {
        maxOrdersPerDevice: 10,    // 每裝置最大訂單數（24小時內）
        suspiciousThreshold: 5     // 可疑行為閾值
    }
};

// 取得當前安全設定（優先使用 localStorage 的設定）
function getSecurityConfig() {
    const savedConfig = localStorage.getItem('security_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            // 轉換管理者面板的設定格式為 SecuritySystem 使用的格式
            return {
                ORDER_RATE_LIMIT: {
                    maxOrders: config.rateLimit.maxOrders,
                    timeWindow: config.rateLimit.timeWindow * 60 * 1000, // 分鐘轉毫秒
                    blockDuration: config.rateLimit.blockDuration * 60 * 1000 // 分鐘轉毫秒
                },
                CART_LIMITS: {
                    maxItems: config.cartLimits.maxItems,
                    maxQuantityPerItem: config.cartLimits.maxQuantityPerProduct,
                    maxTotalQuantity: config.cartLimits.maxTotalQuantity
                },
                ORDER_LIMITS: {
                    minAmount: config.orderLimits.minAmount,
                    maxAmount: config.orderLimits.maxAmount,
                    maxItemPrice: 10000
                },
                DEVICE_LIMITS: {
                    maxOrdersPerDevice: 10,
                    suspiciousThreshold: 5
                },
                CAPTCHA: config.captcha,
                VALIDATION: config.validation
            };
        } catch (e) {
            console.error('讀取安全設定失敗，使用預設值', e);
            return DEFAULT_SECURITY_CONFIG;
        }
    }
    return DEFAULT_SECURITY_CONFIG;
}

// 動態安全設定（會從 localStorage 讀取）
let SECURITY_CONFIG = getSecurityConfig();

// 安全管理系統
const SecuritySystem = {
    // 生成裝置指紋
    getDeviceFingerprint() {
        const fingerprint = localStorage.getItem('deviceFingerprint');
        if (fingerprint) {
            return fingerprint;
        }

        // 生成新的裝置指紋
        const newFingerprint = this.generateFingerprint();
        localStorage.setItem('deviceFingerprint', newFingerprint);
        return newFingerprint;
    },

    // 生成指紋（基於瀏覽器特徵）
    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|||');

        return this.hashString(fingerprint);
    },

    // 簡單哈希函數
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    // 檢查訂單頻率限制
    checkOrderRateLimit() {
        const deviceId = this.getDeviceFingerprint();
        const rateLimitData = JSON.parse(localStorage.getItem('orderRateLimit') || '{}');

        if (!rateLimitData[deviceId]) {
            rateLimitData[deviceId] = {
                orders: [],
                blocked: false,
                blockUntil: null
            };
        }

        const deviceData = rateLimitData[deviceId];

        // 檢查是否被封鎖
        if (deviceData.blocked && deviceData.blockUntil) {
            if (Date.now() < deviceData.blockUntil) {
                const remainingTime = Math.ceil((deviceData.blockUntil - Date.now()) / 60000);
                return {
                    allowed: false,
                    message: `您的操作過於頻繁，已被暫時封鎖。請在 ${remainingTime} 分鐘後再試。`,
                    remainingTime: remainingTime
                };
            } else {
                // 解除封鎖
                deviceData.blocked = false;
                deviceData.blockUntil = null;
                deviceData.orders = [];
            }
        }

        // 清理過期的訂單記錄
        const now = Date.now();
        const timeWindow = SECURITY_CONFIG.ORDER_RATE_LIMIT.timeWindow;
        deviceData.orders = deviceData.orders.filter(timestamp =>
            now - timestamp < timeWindow
        );

        // 檢查訂單數量
        if (deviceData.orders.length >= SECURITY_CONFIG.ORDER_RATE_LIMIT.maxOrders) {
            // 封鎖此裝置
            deviceData.blocked = true;
            deviceData.blockUntil = now + SECURITY_CONFIG.ORDER_RATE_LIMIT.blockDuration;

            localStorage.setItem('orderRateLimit', JSON.stringify(rateLimitData));

            return {
                allowed: false,
                message: `您在短時間內提交了過多訂單，已被暫時封鎖 24 小時。如有疑問請聯繫客服。`,
                remainingTime: 1440
            };
        }

        return {
            allowed: true,
            remaining: SECURITY_CONFIG.ORDER_RATE_LIMIT.maxOrders - deviceData.orders.length
        };
    },

    // 記錄訂單提交
    recordOrderSubmission() {
        const deviceId = this.getDeviceFingerprint();
        const rateLimitData = JSON.parse(localStorage.getItem('orderRateLimit') || '{}');

        if (!rateLimitData[deviceId]) {
            rateLimitData[deviceId] = {
                orders: [],
                blocked: false,
                blockUntil: null
            };
        }

        rateLimitData[deviceId].orders.push(Date.now());
        localStorage.setItem('orderRateLimit', JSON.stringify(rateLimitData));
    },

    // 驗證購物車
    validateCart(cart) {
        const errors = [];

        // 檢查是否為空
        if (!cart || cart.length === 0) {
            errors.push('購物車是空的');
            return { valid: false, errors };
        }

        // 檢查商品種類數量
        if (cart.length > SECURITY_CONFIG.CART_LIMITS.maxItems) {
            errors.push(`購物車商品種類不能超過 ${SECURITY_CONFIG.CART_LIMITS.maxItems} 種`);
        }

        // 檢查總數量
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > SECURITY_CONFIG.CART_LIMITS.maxTotalQuantity) {
            errors.push(`購物車總數量不能超過 ${SECURITY_CONFIG.CART_LIMITS.maxTotalQuantity} 件`);
        }

        // 檢查每個商品
        cart.forEach(item => {
            // 檢查數量
            if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                errors.push(`${item.name} 的數量無效`);
            }

            if (item.quantity > SECURITY_CONFIG.CART_LIMITS.maxQuantityPerItem) {
                errors.push(`${item.name} 的數量不能超過 ${SECURITY_CONFIG.CART_LIMITS.maxQuantityPerItem} 件`);
            }

            // 檢查價格
            if (item.price <= 0 || item.price > SECURITY_CONFIG.ORDER_LIMITS.maxItemPrice) {
                errors.push(`${item.name} 的價格異常`);
            }

            // 檢查是否為有效產品
            const validProduct = products.find(p => p.id === item.productId);
            if (!validProduct) {
                errors.push(`${item.name} 不是有效的產品`);
            } else {
                // 檢查價格是否正確
                if (item.price !== validProduct.prices[item.size]) {
                    errors.push(`${item.name} 的價格已被竄改`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    // 驗證訂單金額
    validateOrderAmount(total) {
        if (total < SECURITY_CONFIG.ORDER_LIMITS.minAmount) {
            return {
                valid: false,
                message: `訂單金額不能低於 NT$ ${SECURITY_CONFIG.ORDER_LIMITS.minAmount}`
            };
        }

        if (total > SECURITY_CONFIG.ORDER_LIMITS.maxAmount) {
            return {
                valid: false,
                message: `訂單金額異常高，請聯繫客服處理大量訂購。`
            };
        }

        return { valid: true };
    },

    // 驗證客戶資料
    validateCustomerData(data) {
        const errors = [];

        // 姓名驗證
        if (!data.name || data.name.trim().length < 2) {
            errors.push('請輸入有效的姓名（至少2個字）');
        }
        if (data.name.length > 50) {
            errors.push('姓名過長');
        }
        if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(data.name)) {
            errors.push('姓名只能包含中文、英文和空格');
        }

        // 電話驗證
        if (!data.phone) {
            errors.push('請輸入電話號碼');
        }
        const phoneRegex = /^09\d{8}$|^0\d{1,2}-?\d{6,8}$/;
        if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
            errors.push('請輸入有效的台灣電話號碼');
        }

        // Email 驗證（如果有填寫）
        if (data.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push('請輸入有效的 Email 地址');
            }
            if (data.email.length > 100) {
                errors.push('Email 地址過長');
            }
        }

        // 地址驗證
        if (!data.address || data.address.trim().length < 5) {
            errors.push('請輸入詳細地址（至少5個字）');
        }
        if (data.address.length > 200) {
            errors.push('地址過長');
        }

        // 備註驗證
        if (data.note && data.note.length > 500) {
            errors.push('備註過長（最多500字）');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    // 資料清理（防止 XSS）
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    },

    // 清理客戶資料
    sanitizeCustomerData(data) {
        return {
            name: this.sanitizeInput(data.name),
            phone: this.sanitizeInput(data.phone),
            email: this.sanitizeInput(data.email),
            address: this.sanitizeInput(data.address),
            note: this.sanitizeInput(data.note)
        };
    },

    // 檢測可疑訂單
    detectSuspiciousOrder(orderData) {
        const flags = [];

        // 檢查相同商品大量訂購
        const itemCounts = {};
        orderData.items.forEach(item => {
            const key = `${item.productId}_${item.size}`;
            itemCounts[key] = (itemCounts[key] || 0) + item.quantity;

            if (item.quantity >= 5) {
                flags.push(`單一商品數量過多: ${item.name} x ${item.quantity}`);
            }
        });

        // 檢查訂單金額
        if (orderData.total > 10000) {
            flags.push(`訂單金額過高: NT$ ${orderData.total}`);
        }

        // 檢查24小時內的訂單數量
        const deviceId = this.getDeviceFingerprint();
        const recentOrders = this.getRecentOrders(deviceId, 86400000); // 24小時

        if (recentOrders.length >= SECURITY_CONFIG.DEVICE_LIMITS.suspiciousThreshold) {
            flags.push(`24小時內訂單數量過多: ${recentOrders.length} 筆`);
        }

        // 檢查相似訂單
        const similarOrders = recentOrders.filter(order =>
            order.customer.phone === orderData.customer.phone ||
            order.customer.email === orderData.customer.email
        );

        if (similarOrders.length > 0) {
            flags.push(`發現相同聯絡方式的訂單: ${similarOrders.length} 筆`);
        }

        return {
            isSuspicious: flags.length >= 2,
            flags: flags,
            riskLevel: flags.length === 0 ? 'low' : flags.length === 1 ? 'medium' : 'high'
        };
    },

    // 取得最近的訂單
    getRecentOrders(deviceId, timeWindow) {
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const now = Date.now();

        return allOrders.filter(order => {
            const orderTime = new Date(order.timestamp).getTime();
            const deviceMatch = order.deviceId === deviceId;
            const timeMatch = now - orderTime < timeWindow;

            return deviceMatch && timeMatch;
        });
    },

    // 記錄可疑活動
    logSuspiciousActivity(activity) {
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');

        logs.push({
            timestamp: new Date().toISOString(),
            deviceId: this.getDeviceFingerprint(),
            activity: activity,
            userAgent: navigator.userAgent
        });

        // 只保留最近100條記錄
        if (logs.length > 100) {
            logs.shift();
        }

        localStorage.setItem('securityLogs', JSON.stringify(logs));
    },

    // 取得安全日誌（管理員用）
    getSecurityLogs() {
        return JSON.parse(localStorage.getItem('securityLogs') || '[]');
    },

    // 清除裝置封鎖（管理員用）
    clearDeviceBlock(deviceId) {
        const rateLimitData = JSON.parse(localStorage.getItem('orderRateLimit') || '{}');

        if (rateLimitData[deviceId]) {
            rateLimitData[deviceId].blocked = false;
            rateLimitData[deviceId].blockUntil = null;
            rateLimitData[deviceId].orders = [];
            localStorage.setItem('orderRateLimit', JSON.stringify(rateLimitData));
            return true;
        }

        return false;
    }
};

// 簡單的數學驗證碼系統
const CaptchaSystem = {
    currentChallenge: null,

    // 生成驗證碼
    generateChallenge() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let answer;
        let question;

        if (operator === '+') {
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
        } else {
            // 確保答案為正數
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            answer = larger - smaller;
            question = `${larger} - ${smaller}`;
        }

        this.currentChallenge = {
            question: question,
            answer: answer,
            timestamp: Date.now()
        };

        return question;
    },

    // 驗證答案
    verify(userAnswer) {
        if (!this.currentChallenge) {
            return { valid: false, message: '請先獲取驗證碼' };
        }

        // 檢查驗證碼是否過期（5分鐘）
        if (Date.now() - this.currentChallenge.timestamp > 300000) {
            this.currentChallenge = null;
            return { valid: false, message: '驗證碼已過期，請重新獲取' };
        }

        const isCorrect = parseInt(userAnswer) === this.currentChallenge.answer;

        if (isCorrect) {
            this.currentChallenge = null; // 清除已使用的驗證碼
        }

        return {
            valid: isCorrect,
            message: isCorrect ? '驗證成功' : '驗證碼錯誤，請重試'
        };
    },

    // 顯示驗證碼
    display() {
        const question = this.generateChallenge();
        return `請回答：${question} = ?`;
    }
};

// 擴展原有的 addToCart 函數，加入購物車驗證
const originalAddToCart = window.addToCart;
window.addToCart = function(productId, size) {
    // 檢查購物車限制
    if (cart.length >= SECURITY_CONFIG.CART_LIMITS.maxItems) {
        alert(`購物車商品種類已達上限（${SECURITY_CONFIG.CART_LIMITS.maxItems} 種）`);
        return;
    }

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity >= SECURITY_CONFIG.CART_LIMITS.maxTotalQuantity) {
        alert(`購物車總數量已達上限（${SECURITY_CONFIG.CART_LIMITS.maxTotalQuantity} 件）`);
        return;
    }

    // 檢查單一商品數量
    const existingItem = cart.find(item => item.productId === productId && item.size === size);
    if (existingItem && existingItem.quantity >= SECURITY_CONFIG.CART_LIMITS.maxQuantityPerItem) {
        alert(`單一商品數量已達上限（${SECURITY_CONFIG.CART_LIMITS.maxQuantityPerItem} 件）`);
        return;
    }

    // 呼叫原始函數
    originalAddToCart.call(this, productId, size);
};

// 在控制台提供管理員工具
console.log('%c🔒 安全系統已啟動', 'color: #27ae60; font-size: 14px; font-weight: bold;');
console.log('管理員指令：');
console.log('  SecuritySystem.getSecurityLogs() - 查看安全日誌');
console.log('  SecuritySystem.clearDeviceBlock(deviceId) - 解除裝置封鎖');
console.log('  SecuritySystem.getDeviceFingerprint() - 查看當前裝置指紋');

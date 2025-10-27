// 管理者系統
const AdminSystem = {
    // 管理者帳號配置（實際使用時應該加密或使用後端驗證）
    credentials: {
        username: 'admin',
        // 密碼: admin123 (SHA-256 hash)
        passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
    },

    // 當前登入狀態
    currentAdmin: null,

    // 初始化
    init() {
        // 檢查是否已登入
        const savedAdmin = localStorage.getItem('admin_session');
        if (savedAdmin) {
            try {
                const session = JSON.parse(savedAdmin);
                // 檢查 session 是否過期（24小時）
                if (Date.now() - session.loginTime < 24 * 60 * 60 * 1000) {
                    this.currentAdmin = session;
                    this.updateAdminUI();
                } else {
                    this.logout();
                }
            } catch (e) {
                console.error('Admin session error:', e);
            }
        }
    },

    // SHA-256 雜湊函數
    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // 登入
    async login(username, password) {
        if (!username || !password) {
            return {
                success: false,
                message: '請輸入帳號和密碼'
            };
        }

        // 驗證帳號
        if (username !== this.credentials.username) {
            console.log('登入失敗：帳號錯誤');
            return {
                success: false,
                message: '帳號或密碼錯誤'
            };
        }

        // 驗證密碼
        const passwordHash = await this.hashPassword(password);
        if (passwordHash !== this.credentials.passwordHash) {
            console.log('登入失敗：密碼錯誤');
            return {
                success: false,
                message: '帳號或密碼錯誤'
            };
        }

        // 登入成功
        this.currentAdmin = {
            username: username,
            loginTime: Date.now()
        };

        // 儲存 session
        localStorage.setItem('admin_session', JSON.stringify(this.currentAdmin));

        // 更新 UI
        this.updateAdminUI();

        console.log('✅ 管理者登入成功');

        return {
            success: true,
            message: '登入成功'
        };
    },

    // 登出
    logout() {
        this.currentAdmin = null;
        localStorage.removeItem('admin_session');
        this.updateAdminUI();
        console.log('管理者已登出');
    },

    // 檢查是否已登入
    isLoggedIn() {
        return this.currentAdmin !== null;
    },

    // 更新 UI（顯示/隱藏管理者功能）
    updateAdminUI() {
        const adminButton = document.getElementById('admin-login-btn');
        const adminPanel = document.getElementById('admin-panel-btn');

        if (this.isLoggedIn()) {
            // 已登入：顯示管理者面板按鈕
            if (adminButton) adminButton.style.display = 'none';
            if (adminPanel) {
                adminPanel.style.display = 'inline-block';
                adminPanel.textContent = '🛠️ 管理者面板';
            }
        } else {
            // 未登入：顯示登入按鈕
            if (adminButton) adminButton.style.display = 'inline-block';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    },

    // 取得安全性設定
    getSecurityConfig() {
        const config = localStorage.getItem('security_config');
        if (config) {
            return JSON.parse(config);
        }

        // 預設設定
        return {
            rateLimit: {
                maxOrders: 3,
                timeWindow: 60, // 分鐘
                blockDuration: 24 * 60 // 分鐘
            },
            cartLimits: {
                maxItems: 20,
                maxQuantityPerProduct: 10,
                maxTotalQuantity: 50
            },
            orderLimits: {
                minAmount: 100,
                maxAmount: 50000
            },
            captcha: {
                enabled: true,
                minValue: 1,
                maxValue: 20
            },
            validation: {
                strictMode: true,
                checkPriceOnBackend: true
            }
        };
    },

    // 更新安全性設定
    updateSecurityConfig(config) {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return false;
        }

        // 驗證設定
        if (!this.validateSecurityConfig(config)) {
            console.error('無效的安全性設定');
            return false;
        }

        // 儲存設定
        localStorage.setItem('security_config', JSON.stringify(config));

        // 套用到 SecuritySystem - 重新載入 SECURITY_CONFIG
        if (typeof getSecurityConfig === 'function') {
            SECURITY_CONFIG = getSecurityConfig();
            console.log('✅ SECURITY_CONFIG 已重新載入', SECURITY_CONFIG);
        }

        console.log('✅ 安全性設定已更新');
        return true;
    },

    // 驗證安全性設定
    validateSecurityConfig(config) {
        if (!config.rateLimit || !config.cartLimits || !config.orderLimits) {
            return false;
        }

        // 檢查數值合理性
        if (config.rateLimit.maxOrders < 1 || config.rateLimit.maxOrders > 100) {
            return false;
        }

        if (config.cartLimits.maxItems < 1 || config.cartLimits.maxItems > 100) {
            return false;
        }

        if (config.orderLimits.minAmount < 0 || config.orderLimits.maxAmount > 1000000) {
            return false;
        }

        return true;
    },

    // 取得商品列表
    getProducts() {
        if (typeof products === 'undefined') {
            console.error('商品資料未載入');
            return [];
        }
        return products;
    },

    // 更新商品資訊
    updateProduct(productId, updates) {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return false;
        }

        if (typeof products === 'undefined') {
            console.error('商品資料未載入');
            return false;
        }

        const product = products.find(p => p.id === productId);
        if (!product) {
            console.error('找不到商品:', productId);
            return false;
        }

        // 更新商品資訊
        Object.assign(product, updates);

        // 儲存到 localStorage
        localStorage.setItem('products_config', JSON.stringify(products));

        // 重新渲染商品
        if (typeof renderProducts === 'function') {
            renderProducts();
        }

        console.log('✅ 商品資訊已更新:', productId);
        return true;
    },

    // 新增商品
    addProduct(productData) {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return false;
        }

        if (typeof products === 'undefined') {
            console.error('商品資料未載入');
            return false;
        }

        // 驗證商品資料
        if (!productData.id || !productData.name || !productData.prices) {
            console.error('商品資料不完整');
            return false;
        }

        // 檢查 ID 是否重複
        if (products.find(p => p.id === productData.id)) {
            console.error('商品 ID 已存在:', productData.id);
            return false;
        }

        // 新增商品
        products.push(productData);

        // 儲存到 localStorage
        localStorage.setItem('products_config', JSON.stringify(products));

        // 重新渲染商品
        if (typeof renderProducts === 'function') {
            renderProducts();
        }

        console.log('✅ 新增商品成功:', productData.id);
        return true;
    },

    // 刪除商品
    deleteProduct(productId) {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return false;
        }

        if (typeof products === 'undefined') {
            console.error('商品資料未載入');
            return false;
        }

        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
            console.error('找不到商品:', productId);
            return false;
        }

        // 刪除商品
        products.splice(index, 1);

        // 儲存到 localStorage
        localStorage.setItem('products_config', JSON.stringify(products));

        // 重新渲染商品
        if (typeof renderProducts === 'function') {
            renderProducts();
        }

        console.log('✅ 刪除商品成功:', productId);
        return true;
    },

    // 取得安全日誌
    getSecurityLogs() {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return [];
        }

        if (typeof SecuritySystem !== 'undefined' && SecuritySystem.getSecurityLogs) {
            return SecuritySystem.getSecurityLogs();
        }

        return [];
    },

    // 清除安全日誌
    clearSecurityLogs() {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return false;
        }

        if (typeof SecuritySystem !== 'undefined') {
            SecuritySystem.securityLogs = [];
            localStorage.removeItem('security_logs');
            console.log('✅ 安全日誌已清除');
            return true;
        }

        return false;
    },

    // 取得訂單統計
    getOrderStats() {
        if (!this.isLoggedIn()) {
            console.error('未登入管理者');
            return null;
        }

        const orders = JSON.parse(localStorage.getItem('orders') || '[]');

        const stats = {
            total: orders.length,
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            topProducts: {}
        };

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        orders.forEach(order => {
            const orderDate = new Date(order.timestamp);

            // 計算日期範圍
            if (orderDate >= todayStart) stats.today++;
            if (orderDate >= weekStart) stats.thisWeek++;
            if (orderDate >= monthStart) stats.thisMonth++;

            // 計算營收
            stats.totalRevenue += order.total;

            // 統計熱門商品
            order.items.forEach(item => {
                if (!stats.topProducts[item.productId]) {
                    stats.topProducts[item.productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                stats.topProducts[item.productId].quantity += item.quantity;
                stats.topProducts[item.productId].revenue += item.subtotal;
            });
        });

        // 計算平均訂單金額
        stats.avgOrderValue = orders.length > 0 ? stats.totalRevenue / orders.length : 0;

        return stats;
    }
};

// 顯示管理者登入對話框
function showAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 關閉管理者登入對話框
function closeAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 提交管理者登入
async function submitAdminLogin(event) {
    event.preventDefault();

    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    const result = await AdminSystem.login(username, password);

    if (result.success) {
        alert('✅ ' + result.message);
        closeAdminLogin();

        // 清空密碼欄位
        document.getElementById('admin-password').value = '';

        // 顯示管理者面板
        showAdminPanel();
    } else {
        alert('❌ ' + result.message);
        document.getElementById('admin-password').value = '';
    }
}

// 管理者登出
function adminLogout() {
    if (confirm('確定要登出嗎？')) {
        AdminSystem.logout();
        closeAdminPanel();
        alert('已登出管理者帳號');
    }
}

// 初始化管理者系統
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        AdminSystem.init();
    });
}

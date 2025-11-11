// 共用功能 - 導航、會員狀態、購物車等

// 網站導航管理
const Navigation = {
    // 初始化導航列
    init() {
        this.renderNavigation();
        this.updateMemberStatus();
        this.updateCartCount();
        this.setActiveNav();
    },

    // 渲染導航列
    renderNavigation() {
        const header = document.querySelector('header .container');
        if (!header) return;

        const currentPage = this.getCurrentPage();

        header.innerHTML = `
            <h1 id="site-title" style="cursor: pointer;" onclick="window.location.href='index.html'">☕ DiDo咖啡</h1>
            <nav class="header-nav">
                <a href="index.html" class="nav-link ${currentPage === 'index' ? 'active' : ''}">首頁</a>
                <a href="products.html" class="nav-link ${currentPage === 'products' ? 'active' : ''}">商品</a>
                <a href="my-orders.html" class="nav-link ${currentPage === 'my-orders' ? 'active' : ''}">我的訂單</a>
                <a href="order-search.html" class="nav-link ${currentPage === 'order-search' ? 'active' : ''}">訂單查詢</a>

                <div id="member-area" class="member-area"></div>

                <div class="cart-icon" onclick="toggleCart()">
                    🛒 購物車 (<span id="cart-count">0</span>)
                </div>
            </nav>
        `;

        // 初始化網站標題
        if (typeof SiteConfig !== 'undefined') {
            SiteConfig.init();
        }

        // 立即更新會員狀態（會設置登入按鈕或會員資訊）
        setTimeout(() => this.updateMemberStatus(), 0);
    },

    // 獲取當前頁面
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);

        if (page === '' || page === 'index.html') return 'index';
        if (page === 'products.html') return 'products';
        if (page === 'my-orders.html') return 'my-orders';
        if (page === 'order-search.html') return 'order-search';
        if (page === 'profile.html') return 'profile';

        return '';
    },

    // 設置當前頁面的導航高亮
    setActiveNav() {
        const currentPage = this.getCurrentPage();
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.nav-link[href="${currentPage}.html"]`) ||
                          document.querySelector(`.nav-link[href="index.html"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    // 更新會員狀態顯示
    updateMemberStatus() {
        const memberArea = document.getElementById('member-area');
        if (!memberArea) return;

        try {
            // 檢查管理員登入
            if (typeof AdminSystem !== 'undefined' && AdminSystem.isLoggedIn && AdminSystem.isLoggedIn()) {
                const admin = AdminSystem.getCurrentAdmin();
                if (admin) {
                    memberArea.innerHTML = `
                        <div class="member-dropdown">
                            <button class="member-btn">🛠️ ${admin.displayName || admin.username}</button>
                            <div class="member-dropdown-content">
                                <a href="#" onclick="showAdminPanel(); return false;">管理者面板</a>
                                <a href="#" onclick="adminLogout(); return false;">登出</a>
                            </div>
                        </div>
                    `;
                    return;
                }
            }

            // 檢查會員登入
            if (typeof MemberSystem !== 'undefined' && MemberSystem.isLoggedIn && MemberSystem.isLoggedIn()) {
                const member = MemberSystem.getCurrentMember();
                if (member) {
                    memberArea.innerHTML = `
                        <div class="member-dropdown">
                            <button class="member-btn">👤 ${member.name}</button>
                            <div class="member-dropdown-content">
                                <a href="profile.html">會員中心</a>
                                <a href="my-orders.html">我的訂單</a>
                                <a href="#" onclick="memberLogout(); return false;">登出</a>
                            </div>
                        </div>
                    `;
                    return;
                }
            }
        } catch (error) {
            console.error('檢查登入狀態時發生錯誤:', error);
        }

        // 默認顯示登入按鈕
        memberArea.innerHTML = `
            <button onclick="showLoginModal()" class="member-btn">登入 / 註冊</button>
        `;
    },

    // 更新購物車數量
    updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) return;

        if (typeof cart !== 'undefined') {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = totalItems;
        }
    }
};

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});

// 提供全域更新函數供其他腳本使用
window.updateNavigation = () => {
    Navigation.updateMemberStatus();
    Navigation.updateCartCount();
};

window.updateCartCount = () => {
    Navigation.updateCartCount();
};

// 會員登出
window.memberLogout = () => {
    if (typeof MemberSystem !== 'undefined') {
        MemberSystem.logout();
        Navigation.updateMemberStatus();

        // 如果在需要登入的頁面，導回首頁
        const currentPage = Navigation.getCurrentPage();
        if (currentPage === 'my-orders' || currentPage === 'profile') {
            window.location.href = 'index.html';
        }
    }
};

// 管理員登出
window.adminLogout = () => {
    if (typeof AdminSystem !== 'undefined') {
        AdminSystem.logout();
        Navigation.updateMemberStatus();
        window.location.href = 'index.html';
    }
};

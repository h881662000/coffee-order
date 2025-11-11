// 網站設定管理

const SiteConfig = {
    // 取得網站標題
    getTitle() {
        const savedTitle = localStorage.getItem('site_title');
        return savedTitle || '☕ DiDo咖啡';
    },

    // 儲存網站標題
    setTitle(title) {
        localStorage.setItem('site_title', title);
        this.updateTitle();
    },

    // 更新頁面標題
    updateTitle() {
        const title = this.getTitle();
        const titleElement = document.getElementById('site-title');
        const pageTitleElement = document.querySelector('title');

        if (titleElement) {
            titleElement.textContent = title;
        }

        if (pageTitleElement) {
            // 移除 emoji 後作為網頁標題
            pageTitleElement.textContent = title.replace(/[☕🫖]/g, '').trim();
        }
    },

    // 初始化
    init() {
        this.updateTitle();
    }
};

// 顯示編輯標題對話框（僅管理員）
function showEditTitleDialog() {
    // 檢查管理員權限
    if (!AdminSystem.isLoggedIn()) {
        alert('❌ 請先登入管理員帳號');
        return;
    }

    const currentTitle = SiteConfig.getTitle();
    const newTitle = prompt('請輸入新的網站標題：', currentTitle);

    if (newTitle !== null && newTitle.trim() !== '') {
        SiteConfig.setTitle(newTitle.trim());
        alert('✅ 網站標題已更新');
    }
}

// 管理員雙擊標題可編輯
document.addEventListener('DOMContentLoaded', () => {
    SiteConfig.init();

    const titleElement = document.getElementById('site-title');
    if (titleElement) {
        titleElement.addEventListener('dblclick', () => {
            if (AdminSystem.isLoggedIn()) {
                showEditTitleDialog();
            }
        });

        // 管理員登入時添加提示
        titleElement.addEventListener('mouseenter', () => {
            if (AdminSystem.isLoggedIn()) {
                titleElement.style.cursor = 'pointer';
                titleElement.title = '雙擊可編輯標題';
            }
        });
    }
});

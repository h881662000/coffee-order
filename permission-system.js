// 權限管理系統
const PermissionSystem = {
    // 可用的權限列表
    PERMISSIONS: {
        MANAGE_PRODUCTS: 'manageProducts',      // 管理商品（新增、編輯、刪除）
        MANAGE_IMAGES: 'manageImages',          // 管理圖片
        MANAGE_ORDERS: 'manageOrders',          // 管理訂單
        MANAGE_MEMBERS: 'manageMembers',        // 管理會員
        MANAGE_SECURITY: 'manageSecurity',      // 管理安全設定
        MANAGE_ADMINS: 'manageAdmins',          // 管理管理員帳號
        VIEW_STATS: 'viewStats',                // 查看統計資料
        VIEW_LOGS: 'viewLogs'                   // 查看日誌
    },

    // 權限中文名稱
    PERMISSION_NAMES: {
        manageProducts: '管理商品',
        manageImages: '管理圖片',
        manageOrders: '管理訂單',
        manageMembers: '管理會員',
        manageSecurity: '管理安全設定',
        manageAdmins: '管理管理員帳號',
        viewStats: '查看統計資料',
        viewLogs: '查看日誌'
    },

    // 初始化系統（建立預設超級管理員）
    init() {
        let admins = this.getAllAdmins();

        // 如果沒有管理員，建立預設超級管理員
        if (Object.keys(admins).length === 0) {
            console.log('建立預設超級管理員帳號');
            admins = {
                'admin': {
                    username: 'admin',
                    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
                    displayName: '超級管理員',
                    permissions: this.getAllPermissions(), // 所有權限
                    createdAt: Date.now(),
                    lastLogin: null,
                    isSuperAdmin: true
                }
            };
            this.saveAdmins(admins);
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

    // 取得所有管理員
    getAllAdmins() {
        const admins = localStorage.getItem('admin_users');
        return admins ? JSON.parse(admins) : {};
    },

    // 儲存管理員資料
    saveAdmins(admins) {
        localStorage.setItem('admin_users', JSON.stringify(admins));
    },

    // 取得單一管理員資料
    getAdmin(username) {
        const admins = this.getAllAdmins();
        return admins[username] || null;
    },

    // 驗證管理員登入
    async validateLogin(username, password) {
        const admin = this.getAdmin(username);
        if (!admin) {
            return { success: false, message: '帳號或密碼錯誤' };
        }

        const passwordHash = await this.hashPassword(password);
        if (passwordHash !== admin.passwordHash) {
            return { success: false, message: '帳號或密碼錯誤' };
        }

        // 更新最後登入時間
        admin.lastLogin = Date.now();
        const admins = this.getAllAdmins();
        admins[username] = admin;
        this.saveAdmins(admins);

        return {
            success: true,
            message: '登入成功',
            admin: {
                username: admin.username,
                displayName: admin.displayName,
                permissions: admin.permissions,
                isSuperAdmin: admin.isSuperAdmin || false
            }
        };
    },

    // 新增管理員（需要 MANAGE_ADMINS 權限）
    async addAdmin(currentAdmin, newAdminData) {
        // 檢查當前管理員權限
        if (!this.hasPermission(currentAdmin, this.PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, message: '沒有權限新增管理員' };
        }

        // 驗證必要欄位
        if (!newAdminData.username || !newAdminData.password || !newAdminData.displayName) {
            return { success: false, message: '請填寫完整資料' };
        }

        // 檢查帳號是否已存在
        if (this.getAdmin(newAdminData.username)) {
            return { success: false, message: '帳號已存在' };
        }

        // 建立新管理員
        const admins = this.getAllAdmins();
        admins[newAdminData.username] = {
            username: newAdminData.username,
            passwordHash: await this.hashPassword(newAdminData.password),
            displayName: newAdminData.displayName,
            permissions: newAdminData.permissions || {},
            createdAt: Date.now(),
            lastLogin: null,
            isSuperAdmin: false
        };

        this.saveAdmins(admins);
        console.log('✅ 新增管理員成功:', newAdminData.username);

        return { success: true, message: '新增管理員成功' };
    },

    // 更新管理員資料
    async updateAdmin(currentAdmin, username, updates) {
        // 檢查權限
        if (!this.hasPermission(currentAdmin, this.PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, message: '沒有權限修改管理員' };
        }

        const admins = this.getAllAdmins();
        const admin = admins[username];

        if (!admin) {
            return { success: false, message: '找不到該管理員' };
        }

        // 不能修改超級管理員的權限（除非自己是超級管理員）
        if (admin.isSuperAdmin && !currentAdmin.isSuperAdmin) {
            return { success: false, message: '無法修改超級管理員' };
        }

        // 更新資料
        if (updates.displayName) {
            admin.displayName = updates.displayName;
        }
        if (updates.password) {
            admin.passwordHash = await this.hashPassword(updates.password);
        }
        if (updates.permissions) {
            admin.permissions = updates.permissions;
        }

        admins[username] = admin;
        this.saveAdmins(admins);

        console.log('✅ 更新管理員成功:', username);
        return { success: true, message: '更新管理員成功' };
    },

    // 刪除管理員
    deleteAdmin(currentAdmin, username) {
        // 檢查權限
        if (!this.hasPermission(currentAdmin, this.PERMISSIONS.MANAGE_ADMINS)) {
            return { success: false, message: '沒有權限刪除管理員' };
        }

        const admins = this.getAllAdmins();
        const admin = admins[username];

        if (!admin) {
            return { success: false, message: '找不到該管理員' };
        }

        // 不能刪除超級管理員
        if (admin.isSuperAdmin) {
            return { success: false, message: '無法刪除超級管理員' };
        }

        // 不能刪除自己
        if (username === currentAdmin.username) {
            return { success: false, message: '無法刪除自己的帳號' };
        }

        delete admins[username];
        this.saveAdmins(admins);

        console.log('✅ 刪除管理員成功:', username);
        return { success: true, message: '刪除管理員成功' };
    },

    // 檢查權限
    hasPermission(admin, permission) {
        if (!admin) return false;

        // 超級管理員擁有所有權限
        if (admin.isSuperAdmin) return true;

        return admin.permissions && admin.permissions[permission] === true;
    },

    // 取得所有可用權限
    getAllPermissions() {
        const permissions = {};
        Object.values(this.PERMISSIONS).forEach(perm => {
            permissions[perm] = true;
        });
        return permissions;
    },

    // 取得權限名稱
    getPermissionName(permission) {
        return this.PERMISSION_NAMES[permission] || permission;
    }
};

// 圖片管理系統
const ImageSystem = {
    // 圖片儲存類型
    STORAGE_TYPE: {
        BASE64: 'base64',
        URL: 'url'
    },

    // 驗證圖片檔案
    validateImageFile(file) {
        // 檢查檔案類型
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return { valid: false, message: '只支援 JPG、PNG、GIF、WebP 格式' };
        }

        // 檢查檔案大小（限制 5MB）
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { valid: false, message: '圖片大小不能超過 5MB' };
        }

        return { valid: true };
    },

    // 驗證圖片 URL
    validateImageURL(url) {
        try {
            const urlObj = new URL(url);
            // 只允許 http 和 https 協議
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return { valid: false, message: '只支援 HTTP 或 HTTPS 網址' };
            }

            // 檢查是否為圖片副檔名
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const pathname = urlObj.pathname.toLowerCase();
            const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));

            if (!hasValidExtension) {
                // 如果沒有副檔名，給予警告但仍允許（某些 CDN 不帶副檔名）
                return { valid: true, warning: '網址可能不是圖片格式' };
            }

            return { valid: true };
        } catch (e) {
            return { valid: false, message: '無效的網址格式' };
        }
    },

    // 將圖片檔案轉換為 Base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    // 壓縮圖片（如果太大）
    async compressImage(base64String, maxWidth = 800, maxHeight = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 計算縮放比例
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                // 建立 canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 轉換為 Base64
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.onerror = reject;
            img.src = base64String;
        });
    },

    // 上傳圖片（Base64 或 URL）
    async uploadImage(input, type) {
        if (type === this.STORAGE_TYPE.BASE64) {
            // 處理檔案上傳
            const validation = this.validateImageFile(input);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            try {
                let base64 = await this.fileToBase64(input);

                // 壓縮圖片
                base64 = await this.compressImage(base64);

                return {
                    success: true,
                    data: {
                        type: this.STORAGE_TYPE.BASE64,
                        value: base64
                    }
                };
            } catch (e) {
                console.error('圖片處理失敗:', e);
                return { success: false, message: '圖片處理失敗' };
            }
        } else if (type === this.STORAGE_TYPE.URL) {
            // 處理網址
            const validation = this.validateImageURL(input);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            return {
                success: true,
                data: {
                    type: this.STORAGE_TYPE.URL,
                    value: input
                },
                warning: validation.warning
            };
        }

        return { success: false, message: '不支援的圖片類型' };
    },

    // 取得圖片顯示用的 URL
    getImageURL(imageData) {
        if (!imageData) return null;

        if (typeof imageData === 'string') {
            // 舊版資料（emoji 或直接 URL）
            return imageData.startsWith('http') ? imageData : null;
        }

        if (imageData.type === this.STORAGE_TYPE.BASE64) {
            return imageData.value;
        } else if (imageData.type === this.STORAGE_TYPE.URL) {
            return imageData.value;
        }

        return null;
    }
};

// 初始化權限系統
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        PermissionSystem.init();
    });
}

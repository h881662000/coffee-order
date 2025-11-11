// 管理者面板 UI 控制

// 顯示管理者面板
function showAdminPanel() {
    if (!AdminSystem.isLoggedIn()) {
        showAdminLogin();
        return;
    }

    // 更新標籤顯示（根據權限）
    updateAllAdminTabsVisibility();
    if (typeof updateAdminTabVisibility === 'function') {
        updateAdminTabVisibility();
    }

    const modal = document.getElementById('admin-panel-modal');
    if (modal) {
        modal.classList.add('active');
        // 預設顯示儀表板
        showAdminDashboard();
    }
}

// 更新所有管理面板標籤的可見性（根據權限）
function updateAllAdminTabsVisibility() {
    if (!AdminSystem.isLoggedIn()) return;

    // 儀表板 - VIEW_STATS
    const dashboardTab = document.querySelector('[onclick="switchAdminTab(\'dashboard\')"]');
    if (dashboardTab) {
        dashboardTab.style.display = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.VIEW_STATS) ? 'block' : 'none';
    }

    // 安全性設定 - MANAGE_SECURITY
    const securityTab = document.querySelector('[onclick="switchAdminTab(\'security\')"]');
    if (securityTab) {
        securityTab.style.display = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_SECURITY) ? 'block' : 'none';
    }

    // 商品管理 - MANAGE_PRODUCTS 或 MANAGE_IMAGES（至少一個）
    const productsTab = document.querySelector('[onclick="switchAdminTab(\'products\')"]');
    if (productsTab) {
        const canAccessProducts = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_PRODUCTS) ||
                                   AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_IMAGES);
        productsTab.style.display = canAccessProducts ? 'block' : 'none';
    }

    // 訂單管理 - MANAGE_ORDERS
    const ordersTab = document.querySelector('[onclick="switchAdminTab(\'orders\')"]');
    if (ordersTab) {
        ordersTab.style.display = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ORDERS) ? 'block' : 'none';
    }

    // 安全日誌 - VIEW_LOGS
    const logsTab = document.querySelector('[onclick="switchAdminTab(\'logs\')"]');
    if (logsTab) {
        logsTab.style.display = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.VIEW_LOGS) ? 'block' : 'none';
    }
}

// 關閉管理者面板
function closeAdminPanel() {
    const modal = document.getElementById('admin-panel-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 切換管理者面板分頁
function switchAdminTab(tabName) {
    // 隱藏所有內容
    const contents = document.querySelectorAll('.admin-tab-content');
    contents.forEach(content => content.style.display = 'none');

    // 移除所有 active 類別
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 顯示選中的內容
    const targetContent = document.getElementById(`admin-${tabName}`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }

    // 標記選中的分頁
    const targetTab = document.querySelector(`[onclick="switchAdminTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // 載入對應內容
    switch (tabName) {
        case 'dashboard':
            showAdminDashboard();
            break;
        case 'security':
            showSecuritySettings();
            break;
        case 'products':
            showProductSettings();
            break;
        case 'orders':
            showOrderManagement();
            break;
        case 'admins':
            if (typeof renderAdminsList === 'function') {
                renderAdminsList();
            }
            break;
        case 'logs':
            showSecurityLogs();
            break;
    }
}

// 顯示儀表板
function showAdminDashboard() {
    const container = document.getElementById('admin-dashboard');
    if (!container) return;

    const stats = AdminSystem.getOrderStats();
    if (!stats) {
        container.innerHTML = '<p>無法載入統計資料</p>';
        return;
    }

    // 取得熱門商品（前3名）
    const topProductsArray = Object.entries(stats.topProducts)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 3);

    let topProductsHtml = '';
    topProductsArray.forEach(([id, data]) => {
        topProductsHtml += `
            <div class="stat-item">
                <strong>${data.name}</strong>
                <span>銷量: ${data.quantity} | 營收: NT$ ${data.revenue.toLocaleString()}</span>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>📊 訂單統計</h3>
                <div class="stat-item">
                    <strong>總訂單數</strong>
                    <span class="stat-value">${stats.total}</span>
                </div>
                <div class="stat-item">
                    <strong>今日訂單</strong>
                    <span class="stat-value">${stats.today}</span>
                </div>
                <div class="stat-item">
                    <strong>本週訂單</strong>
                    <span class="stat-value">${stats.thisWeek}</span>
                </div>
                <div class="stat-item">
                    <strong>本月訂單</strong>
                    <span class="stat-value">${stats.thisMonth}</span>
                </div>
            </div>

            <div class="dashboard-card">
                <h3>💰 營收統計</h3>
                <div class="stat-item">
                    <strong>總營收</strong>
                    <span class="stat-value">NT$ ${stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <strong>平均訂單金額</strong>
                    <span class="stat-value">NT$ ${Math.round(stats.avgOrderValue).toLocaleString()}</span>
                </div>
            </div>

            <div class="dashboard-card">
                <h3>🔥 熱門商品</h3>
                ${topProductsHtml || '<p>尚無訂單資料</p>'}
            </div>

            <div class="dashboard-card">
                <h3>⚙️ 系統狀態</h3>
                <div class="stat-item">
                    <strong>管理者</strong>
                    <span>${AdminSystem.currentAdmin.username}</span>
                </div>
                <div class="stat-item">
                    <strong>登入時間</strong>
                    <span>${new Date(AdminSystem.currentAdmin.loginTime).toLocaleString('zh-TW')}</span>
                </div>
                <div class="stat-item">
                    <strong>安全系統</strong>
                    <span class="stat-value" style="color: #27ae60">✓ 正常運作</span>
                </div>
            </div>
        </div>
    `;
}

// 顯示安全性設定
function showSecuritySettings() {
    const container = document.getElementById('admin-security');
    if (!container) return;

    const config = AdminSystem.getSecurityConfig();

    container.innerHTML = `
        <form id="security-config-form" onsubmit="saveSecuritySettings(event)">
            <div class="settings-section">
                <h3>🚦 訂單頻率限制</h3>
                <div class="form-group">
                    <label>時間窗口內最大訂單數</label>
                    <input type="number" id="rate-max-orders" value="${config.rateLimit.maxOrders}" min="1" max="100">
                    <small>每個裝置在指定時間內最多可下幾筆訂單</small>
                </div>
                <div class="form-group">
                    <label>時間窗口（分鐘）</label>
                    <input type="number" id="rate-time-window" value="${config.rateLimit.timeWindow}" min="1" max="1440">
                    <small>統計訂單數的時間範圍</small>
                </div>
                <div class="form-group">
                    <label>封鎖時間（分鐘）</label>
                    <input type="number" id="rate-block-duration" value="${config.rateLimit.blockDuration}" min="1" max="10080">
                    <small>超過限制後封鎖多久</small>
                </div>
            </div>

            <div class="settings-section">
                <h3>🛒 購物車限制</h3>
                <div class="form-group">
                    <label>最大商品種類數</label>
                    <input type="number" id="cart-max-items" value="${config.cartLimits.maxItems}" min="1" max="100">
                    <small>購物車最多可以有幾種商品</small>
                </div>
                <div class="form-group">
                    <label>單一商品最大數量</label>
                    <input type="number" id="cart-max-per-product" value="${config.cartLimits.maxQuantityPerProduct}" min="1" max="100">
                    <small>單一商品最多可以買幾個</small>
                </div>
                <div class="form-group">
                    <label>購物車總數量上限</label>
                    <input type="number" id="cart-max-total" value="${config.cartLimits.maxTotalQuantity}" min="1" max="1000">
                    <small>購物車所有商品數量總和上限</small>
                </div>
            </div>

            <div class="settings-section">
                <h3>💵 訂單金額限制</h3>
                <div class="form-group">
                    <label>最低訂單金額（NT$）</label>
                    <input type="number" id="order-min-amount" value="${config.orderLimits.minAmount}" min="0" max="100000">
                    <small>訂單金額不得低於此數值</small>
                </div>
                <div class="form-group">
                    <label>最高訂單金額（NT$）</label>
                    <input type="number" id="order-max-amount" value="${config.orderLimits.maxAmount}" min="100" max="1000000">
                    <small>訂單金額不得高於此數值（防止惡意訂單）</small>
                </div>
            </div>

            <div class="settings-section">
                <h3>🔢 驗證碼設定</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="captcha-enabled" ${config.captcha.enabled ? 'checked' : ''}>
                        啟用驗證碼
                    </label>
                    <small>關閉後將不會顯示驗證碼</small>
                </div>
                <div class="form-group">
                    <label>數字範圍（最小值）</label>
                    <input type="number" id="captcha-min" value="${config.captcha.minValue}" min="1" max="50">
                </div>
                <div class="form-group">
                    <label>數字範圍（最大值）</label>
                    <input type="number" id="captcha-max" value="${config.captcha.maxValue}" min="10" max="100">
                </div>
            </div>

            <div class="settings-section">
                <h3>✅ 驗證選項</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="validation-strict" ${config.validation.strictMode ? 'checked' : ''}>
                        嚴格驗證模式
                    </label>
                    <small>啟用更嚴格的資料驗證</small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="validation-price" ${config.validation.checkPriceOnBackend ? 'checked' : ''}>
                        後端價格驗證
                    </label>
                    <small>在後端再次驗證商品價格</small>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-primary">💾 儲存設定</button>
                <button type="button" class="btn-secondary" onclick="resetSecuritySettings()">🔄 重設為預設值</button>
            </div>
        </form>
    `;
}

// 儲存安全性設定
function saveSecuritySettings(event) {
    event.preventDefault();

    const config = {
        rateLimit: {
            maxOrders: parseInt(document.getElementById('rate-max-orders').value),
            timeWindow: parseInt(document.getElementById('rate-time-window').value),
            blockDuration: parseInt(document.getElementById('rate-block-duration').value)
        },
        cartLimits: {
            maxItems: parseInt(document.getElementById('cart-max-items').value),
            maxQuantityPerProduct: parseInt(document.getElementById('cart-max-per-product').value),
            maxTotalQuantity: parseInt(document.getElementById('cart-max-total').value)
        },
        orderLimits: {
            minAmount: parseInt(document.getElementById('order-min-amount').value),
            maxAmount: parseInt(document.getElementById('order-max-amount').value)
        },
        captcha: {
            enabled: document.getElementById('captcha-enabled').checked,
            minValue: parseInt(document.getElementById('captcha-min').value),
            maxValue: parseInt(document.getElementById('captcha-max').value)
        },
        validation: {
            strictMode: document.getElementById('validation-strict').checked,
            checkPriceOnBackend: document.getElementById('validation-price').checked
        }
    };

    if (AdminSystem.updateSecurityConfig(config)) {
        alert('✅ 安全性設定已儲存');
        // 重新載入設定顯示
        showSecuritySettings();
    } else {
        alert('❌ 儲存失敗：設定值無效');
    }
}

// 重設安全性設定
function resetSecuritySettings() {
    if (confirm('確定要重設為預設值嗎？')) {
        localStorage.removeItem('security_config');
        alert('✅ 已重設為預設值');
        showSecuritySettings();
    }
}

// 顯示商品設定
function showProductSettings() {
    const container = document.getElementById('admin-products');
    if (!container) return;

    const products = AdminSystem.getProducts();

    // 檢查權限
    const canManageProducts = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_PRODUCTS);
    const canManageImages = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_IMAGES);

    let productsHtml = '';
    products.forEach(product => {
        // 取得圖片顯示
        const imageURL = typeof ImageSystem !== 'undefined' && product.image
            ? ImageSystem.getImageURL(product.image)
            : null;
        const imageDisplay = imageURL
            ? `<img src="${imageURL}" alt="${product.name}" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`
            : `<div style="font-size: 48px;">${product.image || '☕'}</div>`;

        // 刪除按鈕只有在擁有 MANAGE_PRODUCTS 權限時才顯示
        const deleteButtonHTML = canManageProducts
            ? `<button class="btn-danger btn-small" onclick="deleteProductConfirm('${product.id}')">🗑️ 刪除</button>`
            : '';

        productsHtml += `
            <div class="product-edit-card">
                <div class="product-edit-header">
                    <h4>${product.name}</h4>
                    ${deleteButtonHTML}
                </div>
                <form onsubmit="updateProductInfo(event, '${product.id}')">
                    <div class="form-group">
                        <label>商品 ID</label>
                        <input type="text" value="${product.id}" disabled>
                    </div>
                    <div class="form-group">
                        <label>商品名稱</label>
                        <input type="text" id="name-${product.id}" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <textarea id="description-${product.id}" rows="3">${product.description}</textarea>
                    </div>
                    <div class="form-group">
                        <label>商品圖片</label>
                        <div class="image-preview" id="preview-${product.id}">
                            ${imageDisplay}
                        </div>
                        <div class="image-upload-options">
                            <label class="upload-tab active" onclick="switchUploadMode('${product.id}', 'file')">
                                <input type="radio" name="upload-mode-${product.id}" value="file" checked> 上傳圖片
                            </label>
                            <label class="upload-tab" onclick="switchUploadMode('${product.id}', 'url')">
                                <input type="radio" name="upload-mode-${product.id}" value="url"> 圖片網址
                            </label>
                        </div>
                        <div id="upload-file-${product.id}" class="upload-section active">
                            <input type="file" id="image-file-${product.id}" accept="image/*" onchange="previewImage(event, '${product.id}')">
                            <small>支援 JPG、PNG、GIF、WebP，最大 5MB</small>
                        </div>
                        <div id="upload-url-${product.id}" class="upload-section" style="display:none;">
                            <input type="url" id="image-url-${product.id}" placeholder="https://example.com/image.jpg" onchange="previewImageURL(event, '${product.id}')">
                            <small>請輸入圖片網址</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>120g 價格（NT$）</label>
                            <input type="number" id="price120-${product.id}" value="${product.prices['120g']}" required min="0">
                        </div>
                        <div class="form-group">
                            <label>260g 價格（NT$）</label>
                            <input type="number" id="price260-${product.id}" value="${product.prices['260g']}" required min="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>產地</label>
                        <input type="text" id="origin-${product.id}" value="${product.origin || ''}">
                    </div>
                    <div class="form-group">
                        <label>烘焙度</label>
                        <input type="text" id="roast-${product.id}" value="${product.roast || ''}">
                    </div>
                    <div class="form-group">
                        <label>風味</label>
                        <input type="text" id="flavor-${product.id}" value="${product.flavor || ''}">
                        <small>用逗號分隔，例如：堅果,巧克力,焦糖</small>
                    </div>
                    <button type="submit" class="btn-primary">💾 儲存變更</button>
                </form>
            </div>
        `;
    });

    // 檢查新增商品權限
    const canAddProduct = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_PRODUCTS);
    const addButtonHTML = canAddProduct
        ? '<button class="btn-primary" onclick="showAddProductForm()">➕ 新增商品</button>'
        : '';

    container.innerHTML = `
        <div class="products-management">
            <div class="section-header">
                <h3>📦 商品管理</h3>
                ${addButtonHTML}
            </div>
            ${products.length === 0 ? '<p class="empty-message">目前沒有商品</p>' : `
            <div class="products-grid">
                ${productsHtml}
            </div>`}
        </div>
    `;
}

// 更新商品資訊
async function updateProductInfo(event, productId) {
    event.preventDefault();

    const updates = {
        name: document.getElementById(`name-${productId}`).value,
        description: document.getElementById(`description-${productId}`).value,
        prices: {
            '120g': parseInt(document.getElementById(`price120-${productId}`).value),
            '260g': parseInt(document.getElementById(`price260-${productId}`).value)
        },
        origin: document.getElementById(`origin-${productId}`).value,
        roast: document.getElementById(`roast-${productId}`).value,
        flavor: document.getElementById(`flavor-${productId}`).value
    };

    // 處理圖片上傳
    const uploadMode = document.querySelector(`input[name="upload-mode-${productId}"]:checked`)?.value;
    if (uploadMode === 'file') {
        const fileInput = document.getElementById(`image-file-${productId}`);
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const result = await ImageSystem.uploadImage(fileInput.files[0], ImageSystem.STORAGE_TYPE.BASE64);
            if (result.success) {
                updates.image = result.data;
            } else {
                alert('❌ 圖片上傳失敗: ' + result.message);
                return;
            }
        }
    } else if (uploadMode === 'url') {
        const urlInput = document.getElementById(`image-url-${productId}`);
        if (urlInput && urlInput.value.trim()) {
            const result = await ImageSystem.uploadImage(urlInput.value.trim(), ImageSystem.STORAGE_TYPE.URL);
            if (result.success) {
                updates.image = result.data;
                if (result.warning) {
                    console.warn(result.warning);
                }
            } else {
                alert('❌ 圖片網址無效: ' + result.message);
                return;
            }
        }
    }

    const result = AdminSystem.updateProduct(productId, updates);
    if (result.success) {
        alert('✅ 商品資訊已更新');
        showProductSettings();

        // 更新推薦區域
        if (typeof showHomeRecommendations === 'function') {
            showHomeRecommendations();
        }
    } else {
        alert('❌ 更新失敗: ' + result.message);
    }
}

// 確認刪除商品
function deleteProductConfirm(productId) {
    const product = products.find(p => p.id === productId);
    const productName = product ? product.name : productId;

    if (confirm(`確定要刪除商品「${productName}」嗎？\n此操作無法復原！`)) {
        const result = AdminSystem.deleteProduct(productId);
        if (result.success) {
            alert('✅ ' + result.message);
            showProductSettings();

            // 更新推薦區域
            if (typeof showHomeRecommendations === 'function') {
                showHomeRecommendations();
            }
        } else {
            alert('❌ ' + result.message);
        }
    }
}

// 顯示新增商品表單
function showAddProductForm() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 關閉新增商品表單
function closeAddProductForm() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 提交新增商品
async function submitAddProduct(event) {
    event.preventDefault();

    // 讀取動態價格規格
    const pricesContainer = document.getElementById('new-product-prices-container');
    const priceRows = pricesContainer.querySelectorAll('.price-row');
    const prices = {};

    for (const row of priceRows) {
        const specName = row.querySelector('.spec-name').value.trim();
        const specPrice = parseInt(row.querySelector('.spec-price').value);

        if (specName && specPrice > 0) {
            prices[specName] = specPrice;
        }
    }

    if (Object.keys(prices).length === 0) {
        alert('請至少添加一種商品規格');
        return;
    }

    const productData = {
        id: document.getElementById('new-product-id').value,
        name: document.getElementById('new-product-name').value,
        description: document.getElementById('new-product-description').value,
        prices: prices,
        origin: document.getElementById('new-product-origin').value,
        roast: document.getElementById('new-product-roast').value,
        flavor: document.getElementById('new-product-flavor').value,
        image: '☕' // 預設emoji
    };

    // 處理圖片上傳
    const uploadMode = document.querySelector('input[name="new-upload-mode"]:checked')?.value;
    if (uploadMode === 'file') {
        const fileInput = document.getElementById('new-image-file');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const result = await ImageSystem.uploadImage(fileInput.files[0], ImageSystem.STORAGE_TYPE.BASE64);
            if (result.success) {
                productData.image = result.data;
            } else {
                alert('❌ 圖片上傳失敗: ' + result.message);
                return;
            }
        }
    } else if (uploadMode === 'url') {
        const urlInput = document.getElementById('new-image-url');
        if (urlInput && urlInput.value.trim()) {
            const result = await ImageSystem.uploadImage(urlInput.value.trim(), ImageSystem.STORAGE_TYPE.URL);
            if (result.success) {
                productData.image = result.data;
                if (result.warning) {
                    console.warn(result.warning);
                }
            } else {
                alert('❌ 圖片網址無效: ' + result.message);
                return;
            }
        }
    }

    const result = AdminSystem.addProduct(productData);
    if (result.success) {
        alert('✅ 商品已新增');
        closeAddProductForm();
        showProductSettings();
        event.target.reset();
        // 重置預覽
        const preview = document.getElementById('new-product-preview');
        if (preview) {
            preview.innerHTML = '<div style="font-size: 48px;">☕</div>';
        }

        // 更新推薦區域
        if (typeof showHomeRecommendations === 'function') {
            showHomeRecommendations();
        }
    } else {
        alert('❌ 新增失敗：' + result.message);
    }
}

// 顯示訂單管理
function showOrderManagement() {
    const container = document.getElementById('admin-orders');
    if (!container) return;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    if (orders.length === 0) {
        container.innerHTML = '<p>目前沒有訂單</p>';
        return;
    }

    // 按時間排序（最新的在前）
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let ordersHtml = '';
    orders.forEach(order => {
        const date = new Date(order.timestamp).toLocaleString('zh-TW');
        const itemsText = order.items.map(item =>
            `${item.name} (${item.size}) x ${item.quantity}`
        ).join('<br>');

        ordersHtml += `
            <div class="order-card">
                <div class="order-header">
                    <strong>${order.orderNumber}</strong>
                    <span class="order-date">${date}</span>
                </div>
                <div class="order-body">
                    <div class="order-info">
                        <strong>客戶：</strong> ${order.customer.name}<br>
                        <strong>電話：</strong> ${order.customer.phone}<br>
                        <strong>Email：</strong> ${order.customer.email}<br>
                        <strong>地址：</strong> ${order.customer.address}
                    </div>
                    <div class="order-items">
                        <strong>訂購商品：</strong><br>
                        ${itemsText}
                    </div>
                    <div class="order-total">
                        <strong>總金額：</strong> NT$ ${order.total.toLocaleString()}
                    </div>
                    ${order.customer.note ? `<div class="order-note"><strong>備註：</strong> ${order.customer.note}</div>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="orders-management">
            <div class="section-header">
                <h3>📋 訂單列表（共 ${orders.length} 筆）</h3>
                <button class="btn-secondary" onclick="exportOrdersToCSV()">📥 匯出 CSV</button>
            </div>
            <div class="orders-list">
                ${ordersHtml}
            </div>
        </div>
    `;
}

// 顯示安全日誌
function showSecurityLogs() {
    const container = document.getElementById('admin-logs');
    if (!container) return;

    const logs = AdminSystem.getSecurityLogs();

    if (logs.length === 0) {
        container.innerHTML = '<p>目前沒有安全日誌</p>';
        return;
    }

    // 按時間排序（最新的在前）
    logs.sort((a, b) => b.timestamp - a.timestamp);

    let logsHtml = '';
    logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleString('zh-TW');
        const typeClass = log.type.includes('BLOCK') || log.type.includes('FAIL') ? 'log-warning' : 'log-info';

        logsHtml += `
            <div class="log-entry ${typeClass}">
                <div class="log-header">
                    <strong>${log.type}</strong>
                    <span>${date}</span>
                </div>
                <div class="log-details">
                    ${JSON.stringify(log.data, null, 2)}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="logs-management">
            <div class="section-header">
                <h3>📜 安全日誌（共 ${logs.length} 筆）</h3>
                <button class="btn-danger" onclick="clearLogsConfirm()">🗑️ 清除日誌</button>
            </div>
            <div class="logs-list">
                ${logsHtml}
            </div>
        </div>
    `;
}

// 確認清除日誌
function clearLogsConfirm() {
    if (confirm('確定要清除所有安全日誌嗎？')) {
        if (AdminSystem.clearSecurityLogs()) {
            alert('✅ 日誌已清除');
            showSecurityLogs();
        }
    }
}

// 圖片上傳相關函數

// 切換上傳模式（檔案 / 網址）
function switchUploadMode(productId, mode) {
    const fileSection = document.getElementById(`upload-file-${productId}`);
    const urlSection = document.getElementById(`upload-url-${productId}`);
    const fileTabs = document.querySelectorAll(`label.upload-tab`);

    if (mode === 'file') {
        fileSection.style.display = 'block';
        urlSection.style.display = 'none';
    } else {
        fileSection.style.display = 'none';
        urlSection.style.display = 'block';
    }
}

// 預覽上傳的圖片檔案
function previewImage(event, productId) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById(`preview-${productId}`);
    if (!preview) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="預覽" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
}

// 預覽圖片網址
function previewImageURL(event, productId) {
    const url = event.target.value.trim();
    if (!url) return;

    const preview = document.getElementById(`preview-${productId}`);
    if (!preview) return;

    preview.innerHTML = `<img src="${url}" alt="預覽" style="max-width: 150px; max-height: 150px; border-radius: 8px;" onerror="this.src=''; this.alt='無法載入圖片';">`;
}

// 新商品表單的圖片預覽（添加到新商品表單）
function switchNewProductUploadMode(mode) {
    const fileSection = document.getElementById('new-upload-file');
    const urlSection = document.getElementById('new-upload-url');

    if (mode === 'file') {
        fileSection.style.display = 'block';
        urlSection.style.display = 'none';
    } else {
        fileSection.style.display = 'none';
        urlSection.style.display = 'block';
    }
}

function previewNewProductImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('new-product-preview');
    if (!preview) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="預覽" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`;
    };
    reader.readAsDataURL(file);
}

function previewNewProductImageURL(event) {
    const url = event.target.value.trim();
    if (!url) return;

    const preview = document.getElementById('new-product-preview');
    if (!preview) return;

    preview.innerHTML = `<img src="${url}" alt="預覽" style="max-width: 150px; max-height: 150px; border-radius: 8px;" onerror="this.src=''; this.alt='無法載入圖片';">`;
}

// 新增商品規格
function addNewProductSpec() {
    const container = document.getElementById('new-product-prices-container');
    const priceRow = document.createElement('div');
    priceRow.className = 'price-row';
    priceRow.innerHTML = `
        <input type="text" placeholder="規格名稱（如：120g）" class="spec-name" required>
        <input type="number" placeholder="價格" class="spec-price" required min="0">
        <button type="button" class="remove-spec-btn" onclick="removeNewProductSpec(this)">✕</button>
    `;
    container.appendChild(priceRow);
    updateRemoveButtons();
}

// 移除商品規格
function removeNewProductSpec(button) {
    const container = document.getElementById('new-product-prices-container');
    const rows = container.querySelectorAll('.price-row');

    // 至少保留一個規格
    if (rows.length > 1) {
        button.closest('.price-row').remove();
        updateRemoveButtons();
    } else {
        alert('至少需要保留一種商品規格');
    }
}

// 更新移除按鈕的顯示狀態
function updateRemoveButtons() {
    const container = document.getElementById('new-product-prices-container');
    const rows = container.querySelectorAll('.price-row');
    const removeButtons = container.querySelectorAll('.remove-spec-btn');

    // 如果只有一個規格，隱藏移除按鈕
    if (rows.length === 1) {
        removeButtons.forEach(btn => btn.style.display = 'none');
    } else {
        removeButtons.forEach(btn => btn.style.display = 'flex');
    }
}

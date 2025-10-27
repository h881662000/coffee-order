// 庫存管理系統

// 庫存資料結構
const inventory = {
    'A_120g': { stock: 50, reserved: 0, reorderPoint: 10 },
    'A_260g': { stock: 30, reserved: 0, reorderPoint: 5 },
    'B_120g': { stock: 45, reserved: 0, reorderPoint: 10 },
    'B_260g': { stock: 25, reserved: 0, reorderPoint: 5 },
    'C_120g': { stock: 60, reserved: 0, reorderPoint: 15 },
    'C_260g': { stock: 40, reserved: 0, reorderPoint: 10 },
    'D_120g': { stock: 35, reserved: 0, reorderPoint: 8 },
    'D_260g': { stock: 20, reserved: 0, reorderPoint: 5 }
};

// 庫存管理系統
const InventorySystem = {
    // 初始化庫存
    init() {
        if (!localStorage.getItem('inventory')) {
            localStorage.setItem('inventory', JSON.stringify(inventory));
        }
    },

    // 取得庫存資料
    getInventory() {
        return JSON.parse(localStorage.getItem('inventory') || JSON.stringify(inventory));
    },

    // 儲存庫存資料
    saveInventory(inventoryData) {
        localStorage.setItem('inventory', JSON.stringify(inventoryData));
    },

    // 取得產品庫存
    getStock(productId, size) {
        const key = `${productId}_${size}`;
        const inv = this.getInventory();
        return inv[key] || { stock: 0, reserved: 0, reorderPoint: 0 };
    },

    // 取得可用庫存
    getAvailableStock(productId, size) {
        const stockInfo = this.getStock(productId, size);
        return stockInfo.stock - stockInfo.reserved;
    },

    // 檢查是否有足夠庫存
    checkAvailability(productId, size, quantity) {
        const available = this.getAvailableStock(productId, size);
        return available >= quantity;
    },

    // 預留庫存（加入購物車時）
    reserveStock(productId, size, quantity) {
        const key = `${productId}_${size}`;
        const inv = this.getInventory();

        if (!inv[key]) return false;

        const available = inv[key].stock - inv[key].reserved;
        if (available >= quantity) {
            inv[key].reserved += quantity;
            this.saveInventory(inv);
            return true;
        }
        return false;
    },

    // 釋放預留庫存（從購物車移除時）
    releaseStock(productId, size, quantity) {
        const key = `${productId}_${size}`;
        const inv = this.getInventory();

        if (!inv[key]) return;

        inv[key].reserved = Math.max(0, inv[key].reserved - quantity);
        this.saveInventory(inv);
    },

    // 扣除庫存（訂單確認時）
    deductStock(productId, size, quantity) {
        const key = `${productId}_${size}`;
        const inv = this.getInventory();

        if (!inv[key]) return false;

        if (inv[key].stock >= quantity) {
            inv[key].stock -= quantity;
            inv[key].reserved = Math.max(0, inv[key].reserved - quantity);
            this.saveInventory(inv);

            // 檢查是否需要補貨
            this.checkReorderPoint(key);
            return true;
        }
        return false;
    },

    // 檢查補貨點
    checkReorderPoint(key) {
        const inv = this.getInventory();
        if (!inv[key]) return;

        if (inv[key].stock <= inv[key].reorderPoint) {
            console.warn(`⚠️ ${key} 庫存不足，建議補貨！當前庫存：${inv[key].stock}`);
            this.addReorderAlert(key, inv[key].stock);
        }
    },

    // 新增補貨提醒
    addReorderAlert(productKey, currentStock) {
        let alerts = JSON.parse(localStorage.getItem('reorderAlerts') || '[]');

        const existingIndex = alerts.findIndex(a => a.productKey === productKey);
        if (existingIndex === -1) {
            alerts.push({
                productKey: productKey,
                currentStock: currentStock,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('reorderAlerts', JSON.stringify(alerts));
        }
    },

    // 取得補貨提醒列表
    getReorderAlerts() {
        return JSON.parse(localStorage.getItem('reorderAlerts') || '[]');
    },

    // 補貨
    restock(productId, size, quantity) {
        const key = `${productId}_${size}`;
        const inv = this.getInventory();

        if (!inv[key]) {
            inv[key] = { stock: 0, reserved: 0, reorderPoint: 5 };
        }

        inv[key].stock += quantity;
        this.saveInventory(inv);

        // 移除補貨提醒
        this.removeReorderAlert(key);
        return true;
    },

    // 移除補貨提醒
    removeReorderAlert(productKey) {
        let alerts = JSON.parse(localStorage.getItem('reorderAlerts') || '[]');
        alerts = alerts.filter(a => a.productKey !== productKey);
        localStorage.setItem('reorderAlerts', JSON.stringify(alerts));
    },

    // 取得所有庫存狀態
    getAllStockStatus() {
        const inv = this.getInventory();
        return Object.entries(inv).map(([key, data]) => {
            const [productId, size] = key.split('_');
            const product = products.find(p => p.id === productId);
            return {
                key: key,
                productId: productId,
                productName: product ? product.name : productId,
                size: size,
                stock: data.stock,
                reserved: data.reserved,
                available: data.stock - data.reserved,
                reorderPoint: data.reorderPoint,
                needReorder: data.stock <= data.reorderPoint
            };
        });
    }
};

// 更新產品卡片的庫存顯示
function updateProductStockDisplay() {
    products.forEach(product => {
        ['120g', '260g'].forEach(size => {
            const available = InventorySystem.getAvailableStock(product.id, size);
            const stockBadge = document.querySelector(`[data-product="${product.id}"][data-size="${size}"] .stock-badge`);

            if (stockBadge) {
                if (available === 0) {
                    stockBadge.textContent = '缺貨';
                    stockBadge.className = 'stock-badge out-of-stock';
                } else if (available <= 5) {
                    stockBadge.textContent = `剩 ${available} 件`;
                    stockBadge.className = 'stock-badge low-stock';
                } else {
                    stockBadge.textContent = `庫存 ${available}`;
                    stockBadge.className = 'stock-badge in-stock';
                }
            }
        });
    });
}

// 顯示庫存管理介面（管理員用）
function showInventoryManagement() {
    const modal = document.getElementById('inventory-modal');
    if (!modal) return;

    const stockStatus = InventorySystem.getAllStockStatus();
    const reorderAlerts = InventorySystem.getReorderAlerts();

    let html = '';

    if (reorderAlerts.length > 0) {
        html += '<div class="reorder-alerts"><h3>⚠️ 補貨提醒</h3><ul>';
        reorderAlerts.forEach(alert => {
            const status = stockStatus.find(s => s.key === alert.productKey);
            if (status) {
                html += `
                    <li class="alert-item">
                        ${status.productName} (${status.size}) -
                        當前庫存：${status.stock} 件
                        <button onclick="quickRestock('${status.productId}', '${status.size}', 20)">
                            快速補貨 +20
                        </button>
                    </li>
                `;
            }
        });
        html += '</ul></div>';
    }

    html += '<div class="inventory-table"><table><thead><tr>';
    html += '<th>產品</th><th>規格</th><th>庫存</th><th>預留</th><th>可用</th><th>補貨點</th><th>操作</th>';
    html += '</tr></thead><tbody>';

    stockStatus.forEach(item => {
        html += `
            <tr class="${item.needReorder ? 'need-reorder' : ''}">
                <td>${item.productName}</td>
                <td>${item.size}</td>
                <td>${item.stock}</td>
                <td>${item.reserved}</td>
                <td class="${item.available === 0 ? 'text-danger' : item.available <= 5 ? 'text-warning' : ''}">
                    ${item.available}
                </td>
                <td>${item.reorderPoint}</td>
                <td>
                    <button onclick="showRestockModal('${item.productId}', '${item.size}')" class="btn-small">
                        補貨
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';

    document.getElementById('inventory-content').innerHTML = html;
    modal.classList.add('active');
}

// 快速補貨
function quickRestock(productId, size, quantity) {
    if (confirm(`確定要為 ${productId} (${size}) 補貨 ${quantity} 件嗎？`)) {
        InventorySystem.restock(productId, size, quantity);
        alert('補貨成功！');
        showInventoryManagement(); // 重新整理顯示
        updateProductStockDisplay();
    }
}

// 顯示補貨視窗
function showRestockModal(productId, size) {
    const quantity = prompt(`請輸入要補貨的數量（${productId} - ${size}）：`);

    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        InventorySystem.restock(productId, size, parseInt(quantity));
        alert('補貨成功！');
        showInventoryManagement();
        updateProductStockDisplay();
    }
}

// 關閉庫存管理介面
function closeInventoryModal() {
    const modal = document.getElementById('inventory-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 初始化庫存系統
document.addEventListener('DOMContentLoaded', () => {
    InventorySystem.init();
    updateProductStockDisplay();
});

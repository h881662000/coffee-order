// 訂單查詢與追蹤功能

// 訂單狀態
const ORDER_STATUS = {
    PENDING: { name: '待處理', color: '#f39c12', icon: '⏳' },
    CONFIRMED: { name: '已確認', color: '#3498db', icon: '✓' },
    PROCESSING: { name: '處理中', color: '#9b59b6', icon: '📦' },
    SHIPPED: { name: '已出貨', color: '#2ecc71', icon: '🚚' },
    DELIVERED: { name: '已送達', color: '#27ae60', icon: '✅' },
    CANCELLED: { name: '已取消', color: '#e74c3c', icon: '✕' }
};

// 訂單追蹤系統
const OrderTracking = {
    // 新增訂單追蹤資訊
    addOrder(orderNumber, orderData) {
        let orders = this.getAllOrders();

        const trackingData = {
            orderNumber: orderNumber,
            status: 'PENDING',
            ...orderData,
            statusHistory: [{
                status: 'PENDING',
                timestamp: new Date().toISOString(),
                note: '訂單已建立'
            }],
            trackingNumber: null,
            estimatedDelivery: this.calculateEstimatedDelivery()
        };

        orders.push(trackingData);
        localStorage.setItem('orderTracking', JSON.stringify(orders));

        return trackingData;
    },

    // 取得所有訂單
    getAllOrders() {
        const data = localStorage.getItem('orderTracking');
        return data ? JSON.parse(data) : [];
    },

    // 依訂單編號查詢
    getOrderByNumber(orderNumber) {
        const orders = this.getAllOrders();
        return orders.find(o => o.orderNumber === orderNumber);
    },

    // 依電話查詢訂單
    getOrdersByPhone(phone) {
        const orders = this.getAllOrders();
        return orders.filter(o => o.customer.phone === phone);
    },

    // 依 Email 查詢訂單
    getOrdersByEmail(email) {
        const orders = this.getAllOrders();
        return orders.filter(o => o.customer.email === email);
    },

    // 更新訂單狀態
    updateOrderStatus(orderNumber, newStatus, note = '') {
        let orders = this.getAllOrders();
        const index = orders.findIndex(o => o.orderNumber === orderNumber);

        if (index !== -1) {
            orders[index].status = newStatus;
            orders[index].statusHistory.push({
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || ORDER_STATUS[newStatus].name
            });

            localStorage.setItem('orderTracking', JSON.stringify(orders));
            return orders[index];
        }
        return null;
    },

    // 新增物流單號
    addTrackingNumber(orderNumber, trackingNumber) {
        let orders = this.getAllOrders();
        const index = orders.findIndex(o => o.orderNumber === orderNumber);

        if (index !== -1) {
            orders[index].trackingNumber = trackingNumber;
            localStorage.setItem('orderTracking', JSON.stringify(orders));
            return orders[index];
        }
        return null;
    },

    // 計算預計送達日期
    calculateEstimatedDelivery(days = 3) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    },

    // 取得會員的所有訂單
    getMemberOrders() {
        const member = MemberSystem.getCurrentMember();
        if (!member) return [];

        const orders = this.getAllOrders();
        return orders.filter(o =>
            o.customer.email === member.email ||
            o.customer.phone === member.phone
        );
    }
};

// 顯示訂單查詢視窗
function showOrderSearchModal() {
    const modal = document.getElementById('order-search-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 關閉訂單查詢視窗
function closeOrderSearchModal() {
    const modal = document.getElementById('order-search-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 查詢訂單
function searchOrder(event) {
    event.preventDefault();

    const searchType = document.getElementById('search-type').value;
    const searchValue = document.getElementById('search-value').value.trim();

    if (!searchValue) {
        alert('請輸入查詢資料');
        return;
    }

    let orders = [];

    switch (searchType) {
        case 'orderNumber':
            const order = OrderTracking.getOrderByNumber(searchValue);
            if (order) orders = [order];
            break;
        case 'phone':
            orders = OrderTracking.getOrdersByPhone(searchValue);
            break;
        case 'email':
            orders = OrderTracking.getOrdersByEmail(searchValue);
            break;
    }

    displaySearchResults(orders);
}

// 顯示查詢結果
function displaySearchResults(orders) {
    const resultsContainer = document.getElementById('search-results');

    if (orders.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">找不到訂單資料</div>';
        return;
    }

    resultsContainer.innerHTML = orders.map(order => {
        const statusInfo = ORDER_STATUS[order.status];
        const estimatedDate = new Date(order.estimatedDelivery).toLocaleDateString('zh-TW');

        return `
            <div class="order-result-card">
                <div class="order-result-header">
                    <div class="order-number">${order.orderNumber}</div>
                    <div class="order-status" style="color: ${statusInfo.color}">
                        ${statusInfo.icon} ${statusInfo.name}
                    </div>
                </div>

                <div class="order-result-info">
                    <p><strong>訂單日期：</strong>${new Date(order.timestamp).toLocaleString('zh-TW')}</p>
                    <p><strong>收件人：</strong>${order.customer.name}</p>
                    <p><strong>金額：</strong>NT$ ${order.total.toLocaleString()}</p>
                    ${order.trackingNumber ? `<p><strong>物流單號：</strong>${order.trackingNumber}</p>` : ''}
                    <p><strong>預計送達：</strong>${estimatedDate}</p>
                </div>

                <div class="order-result-items">
                    <strong>商品明細：</strong>
                    ${order.items.map(item => `
                        <div class="order-item-line">
                            ${item.name} (${item.size}) x ${item.quantity}
                        </div>
                    `).join('')}
                </div>

                <button class="view-detail-btn" onclick="showOrderDetail('${order.orderNumber}')">
                    查看詳細資訊
                </button>
            </div>
        `;
    }).join('');
}

// 顯示訂單詳細資訊
function showOrderDetail(orderNumber) {
    const order = OrderTracking.getOrderByNumber(orderNumber);
    if (!order) return;

    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    const statusInfo = ORDER_STATUS[order.status];

    document.getElementById('order-detail-content').innerHTML = `
        <div class="order-detail-header">
            <h2>訂單編號：${order.orderNumber}</h2>
            <div class="order-status-badge" style="background: ${statusInfo.color}">
                ${statusInfo.icon} ${statusInfo.name}
            </div>
        </div>

        <div class="order-timeline">
            <h3>訂單進度</h3>
            ${order.statusHistory.map((history, index) => {
                const historyStatus = ORDER_STATUS[history.status];
                return `
                    <div class="timeline-item ${index === order.statusHistory.length - 1 ? 'active' : ''}">
                        <div class="timeline-dot" style="background: ${historyStatus.color}">
                            ${historyStatus.icon}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-title">${historyStatus.name}</div>
                            <div class="timeline-time">${new Date(history.timestamp).toLocaleString('zh-TW')}</div>
                            ${history.note ? `<div class="timeline-note">${history.note}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <div class="order-detail-section">
            <h3>收件資訊</h3>
            <p><strong>收件人：</strong>${order.customer.name}</p>
            <p><strong>電話：</strong>${order.customer.phone}</p>
            <p><strong>Email：</strong>${order.customer.email}</p>
            <p><strong>地址：</strong>${order.customer.address}</p>
            ${order.customer.note ? `<p><strong>備註：</strong>${order.customer.note}</p>` : ''}
        </div>

        <div class="order-detail-section">
            <h3>商品明細</h3>
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>商品名稱</th>
                        <th>規格</th>
                        <th>數量</th>
                        <th>金額</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.size}</td>
                            <td>${item.quantity}</td>
                            <td>NT$ ${item.subtotal.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>總計</strong></td>
                        <td><strong>NT$ ${order.total.toLocaleString()}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        ${order.trackingNumber ? `
            <div class="order-detail-section">
                <h3>物流資訊</h3>
                <p><strong>物流單號：</strong>${order.trackingNumber}</p>
                <p><strong>預計送達：</strong>${new Date(order.estimatedDelivery).toLocaleDateString('zh-TW')}</p>
            </div>
        ` : ''}
    `;

    modal.classList.add('active');
    closeOrderSearchModal();
}

// 關閉訂單詳細資訊視窗
function closeOrderDetailModal() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 顯示我的訂單（會員專用）
function showMyOrders() {
    const member = MemberSystem.getCurrentMember();
    if (!member) {
        alert('請先登入會員');
        showLoginModal();
        return;
    }

    const orders = OrderTracking.getMemberOrders();
    displaySearchResults(orders);
    showOrderSearchModal();
}

// 管理者面板進階功能：會員管理、報表分析、成本管理

// ==================== 會員管理 ====================

// 顯示會員管理
function showMemberManagement() {
    const container = document.getElementById('admin-members');
    if (!container) return;

    const members = MemberSystem ? MemberSystem.getAllMembers() : [];

    if (members.length === 0) {
        container.innerHTML = '<p>目前沒有會員</p>';
        return;
    }

    // 統計
    const stats = {
        total: members.length,
        bronze: members.filter(m => m.level === 'bronze').length,
        silver: members.filter(m => m.level === 'silver').length,
        gold: members.filter(m => m.level === 'gold').length,
        platinum: members.filter(m => m.level === 'platinum').length
    };

    let html = `
        <div class="members-management">
            <div class="section-header">
                <h3>👥 會員列表（共 ${members.length} 位）</h3>
                <button class="btn-secondary" onclick="exportMembersToCSV()">📥 匯出 CSV</button>
            </div>

            <div class="dashboard-grid" style="margin-bottom: 20px;">
                <div class="dashboard-card">
                    <h4>會員等級分布</h4>
                    <div class="stat-item">
                        <strong>🥉 銅牌會員</strong>
                        <span class="stat-value">${stats.bronze}</span>
                    </div>
                    <div class="stat-item">
                        <strong>🥈 銀牌會員</strong>
                        <span class="stat-value">${stats.silver}</span>
                    </div>
                    <div class="stat-item">
                        <strong>🥇 金牌會員</strong>
                        <span class="stat-value">${stats.gold}</span>
                    </div>
                    <div class="stat-item">
                        <strong>💎 白金會員</strong>
                        <span class="stat-value">${stats.platinum}</span>
                    </div>
                </div>
            </div>

            <div class="members-list">
    `;

    members.forEach(member => {
        const levelIcon = {
            bronze: '🥉',
            silver: '🥈',
            gold: '🥇',
            platinum: '💎'
        }[member.level] || '👤';

        const joinDate = new Date(member.joinDate).toLocaleDateString('zh-TW');
        const lastOrder = member.lastOrderDate ? new Date(member.lastOrderDate).toLocaleDateString('zh-TW') : '無';

        html += `
            <div class="member-card">
                <div class="member-header">
                    <div>
                        ${levelIcon} <strong>${member.name}</strong>
                        <span class="member-level">${member.level}</span>
                    </div>
                    <button class="btn-danger btn-small" onclick="deleteMemberConfirm('${member.id}')">🗑️ 刪除</button>
                </div>
                <div class="member-body">
                    <div><strong>Email:</strong> ${member.email}</div>
                    <div><strong>電話:</strong> ${member.phone}</div>
                    <div><strong>點數:</strong> ${member.points} 點</div>
                    <div><strong>總消費:</strong> NT$ ${member.totalSpent.toLocaleString()}</div>
                    <div><strong>訂單數:</strong> ${member.orderCount} 筆</div>
                    <div><strong>加入日期:</strong> ${joinDate}</div>
                    <div><strong>最後訂單:</strong> ${lastOrder}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-primary btn-small" onclick="editMember('${member.id}')">✏️ 編輯</button>
                    <button class="btn-secondary btn-small" onclick="viewMemberOrders('${member.id}')">📋 訂單記錄</button>
                    <button class="btn-secondary btn-small" onclick="adjustPoints('${member.id}')">🎁 調整點數</button>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// 刪除會員確認
function deleteMemberConfirm(memberId) {
    if (confirm('確定要刪除此會員嗎？\n此操作無法復原！')) {
        if (MemberSystem && MemberSystem.deleteMember) {
            MemberSystem.deleteMember(memberId);
            alert('✅ 會員已刪除');
            showMemberManagement();
        } else {
            alert('❌ 刪除失敗');
        }
    }
}

// 編輯會員
function editMember(memberId) {
    // TODO: 實作會員編輯對話框
    alert('會員編輯功能開發中...');
}

// 查看會員訂單
function viewMemberOrders(memberId) {
    // TODO: 實作會員訂單查詢
    alert('會員訂單查詢功能開發中...');
}

// 調整點數
function adjustPoints(memberId) {
    const points = prompt('請輸入要調整的點數（正數增加，負數扣除）：');
    if (points === null) return;

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum)) {
        alert('請輸入有效的數字');
        return;
    }

    if (MemberSystem && MemberSystem.adjustPoints) {
        MemberSystem.adjustPoints(memberId, pointsNum);
        alert(`✅ 點數已調整 ${pointsNum > 0 ? '+' : ''}${pointsNum}`);
        showMemberManagement();
    } else {
        alert('❌ 調整失敗');
    }
}

// 匯出會員資料為 CSV
function exportMembersToCSV() {
    const members = MemberSystem ? MemberSystem.getAllMembers() : [];
    if (members.length === 0) {
        alert('沒有會員資料');
        return;
    }

    let csv = 'ID,姓名,Email,電話,等級,點數,總消費,訂單數,加入日期,最後訂單\n';

    members.forEach(member => {
        const row = [
            member.id,
            member.name,
            member.email,
            member.phone,
            member.level,
            member.points,
            member.totalSpent,
            member.orderCount,
            new Date(member.joinDate).toLocaleDateString('zh-TW'),
            member.lastOrderDate ? new Date(member.lastOrderDate).toLocaleDateString('zh-TW') : '無'
        ].map(field => `"${field}"`).join(',');

        csv += row + '\n';
    });

    // 下載 CSV
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ==================== 報表分析 ====================

// 顯示報表分析
function showReportsAnalysis() {
    const container = document.getElementById('admin-reports');
    if (!container) return;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    if (orders.length === 0) {
        container.innerHTML = '<p>目前沒有訂單資料</p>';
        return;
    }

    // 計算報表數據
    const reportData = calculateReportData(orders);

    let html = `
        <div class="reports-management">
            <div class="section-header">
                <h3>📈 報表分析</h3>
                <button class="btn-secondary" onclick="exportReportToCSV()">📥 匯出報表</button>
            </div>

            <!-- 營收分析 -->
            <div class="dashboard-card">
                <h3>💰 營收分析</h3>
                <div class="stat-item">
                    <strong>總營收</strong>
                    <span class="stat-value">NT$ ${reportData.revenue.total.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <strong>今日營收</strong>
                    <span class="stat-value">NT$ ${reportData.revenue.today.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <strong>本週營收</strong>
                    <span class="stat-value">NT$ ${reportData.revenue.thisWeek.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <strong>本月營收</strong>
                    <span class="stat-value">NT$ ${reportData.revenue.thisMonth.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <strong>平均訂單金額</strong>
                    <span class="stat-value">NT$ ${Math.round(reportData.revenue.average).toLocaleString()}</span>
                </div>
            </div>

            <!-- 商品銷售排行 -->
            <div class="dashboard-card">
                <h3>🏆 商品銷售排行</h3>
                ${renderProductRanking(reportData.products)}
            </div>

            <!-- 時段分析 -->
            <div class="dashboard-card">
                <h3>⏰ 訂單時段分析</h3>
                ${renderTimeAnalysis(reportData.timeSlots)}
            </div>

            <!-- 付款方式統計 -->
            <div class="dashboard-card">
                <h3>💳 付款方式統計</h3>
                ${renderPaymentStats(reportData.payments)}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// 計算報表數據
function calculateReportData(orders) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const data = {
        revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, average: 0 },
        products: {},
        timeSlots: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        payments: {}
    };

    orders.forEach(order => {
        const orderDate = new Date(order.timestamp);
        const amount = order.total;

        // 營收
        data.revenue.total += amount;
        if (orderDate >= todayStart) data.revenue.today += amount;
        if (orderDate >= weekStart) data.revenue.thisWeek += amount;
        if (orderDate >= monthStart) data.revenue.thisMonth += amount;

        // 商品銷售
        order.items.forEach(item => {
            const key = `${item.productId}-${item.size}`;
            if (!data.products[key]) {
                data.products[key] = {
                    name: item.name,
                    size: item.size,
                    quantity: 0,
                    revenue: 0
                };
            }
            data.products[key].quantity += item.quantity;
            data.products[key].revenue += item.subtotal;
        });

        // 時段分析
        const hour = orderDate.getHours();
        if (hour >= 6 && hour < 12) data.timeSlots.morning++;
        else if (hour >= 12 && hour < 18) data.timeSlots.afternoon++;
        else if (hour >= 18 && hour < 22) data.timeSlots.evening++;
        else data.timeSlots.night++;

        // 付款方式
        const payment = order.paymentMethod || 'COD';
        data.payments[payment] = (data.payments[payment] || 0) + 1;
    });

    data.revenue.average = orders.length > 0 ? data.revenue.total / orders.length : 0;

    return data;
}

// 渲染商品排行
function renderProductRanking(products) {
    const sorted = Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    let html = '<div class="ranking-list">';
    sorted.forEach((product, index) => {
        html += `
            <div class="ranking-item">
                <span class="rank">#${index + 1}</span>
                <span class="product-name">${product.name} (${product.size})</span>
                <span>銷量: ${product.quantity}</span>
                <span>營收: NT$ ${product.revenue.toLocaleString()}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// 渲染時段分析
function renderTimeAnalysis(timeSlots) {
    const total = Object.values(timeSlots).reduce((sum, val) => sum + val, 0);

    return `
        <div class="stat-item">
            <strong>早上 (6-12)</strong>
            <span>${timeSlots.morning} 筆 (${total > 0 ? Math.round(timeSlots.morning / total * 100) : 0}%)</span>
        </div>
        <div class="stat-item">
            <strong>下午 (12-18)</strong>
            <span>${timeSlots.afternoon} 筆 (${total > 0 ? Math.round(timeSlots.afternoon / total * 100) : 0}%)</span>
        </div>
        <div class="stat-item">
            <strong>晚上 (18-22)</strong>
            <span>${timeSlots.evening} 筆 (${total > 0 ? Math.round(timeSlots.evening / total * 100) : 0}%)</span>
        </div>
        <div class="stat-item">
            <strong>深夜 (22-6)</strong>
            <span>${timeSlots.night} 筆 (${total > 0 ? Math.round(timeSlots.night / total * 100) : 0}%)</span>
        </div>
    `;
}

// 渲染付款方式統計
function renderPaymentStats(payments) {
    const paymentNames = {
        'COD': '貨到付款',
        'BANK': '銀行轉帳',
        'CREDIT': '信用卡',
        'LINEPAY': 'LINE Pay',
        'JKOPAY': '街口支付',
        'ATM': 'ATM轉帳'
    };

    let html = '';
    for (const [method, count] of Object.entries(payments)) {
        html += `
            <div class="stat-item">
                <strong>${paymentNames[method] || method}</strong>
                <span class="stat-value">${count} 筆</span>
            </div>
        `;
    }
    return html;
}

// ==================== 成本管理 ====================

// 顯示成本管理
function showCostManagement() {
    const container = document.getElementById('admin-costs');
    if (!container) return;

    const costData = getCostData();

    let html = `
        <div class="costs-management">
            <div class="section-header">
                <h3>💰 成本管理</h3>
                <button class="btn-primary" onclick="showAddCostForm()">➕ 新增成本項目</button>
            </div>

            <!-- 商品成本列表 -->
            <div class="costs-grid">
    `;

    products.forEach(product => {
        const cost = costData[product.id] || { cost120: 0, cost260: 0 };
        const profit120 = product.prices['120g'] - cost.cost120;
        const profit260 = product.prices['260g'] - cost.cost260;
        const margin120 = cost.cost120 > 0 ? ((profit120 / product.prices['120g']) * 100).toFixed(1) : 0;
        const margin260 = cost.cost260 > 0 ? ((profit260 / product.prices['260g']) * 100).toFixed(1) : 0;

        html += `
            <div class="cost-card">
                <div class="cost-header">
                    <h4>${product.name}</h4>
                    <button class="btn-primary btn-small" onclick="editCost('${product.id}')">✏️ 編輯成本</button>
                </div>
                <div class="cost-body">
                    <div class="cost-section">
                        <h5>120g 規格</h5>
                        <div class="cost-row">
                            <span>售價：</span>
                            <span>NT$ ${product.prices['120g']}</span>
                        </div>
                        <div class="cost-row">
                            <span>成本：</span>
                            <span>NT$ ${cost.cost120}</span>
                        </div>
                        <div class="cost-row">
                            <span>毛利：</span>
                            <span style="color: ${profit120 > 0 ? 'green' : 'red'}">NT$ ${profit120}</span>
                        </div>
                        <div class="cost-row">
                            <span>毛利率：</span>
                            <span style="color: ${margin120 > 30 ? 'green' : margin120 > 15 ? 'orange' : 'red'}">${margin120}%</span>
                        </div>
                    </div>
                    <div class="cost-section">
                        <h5>260g 規格</h5>
                        <div class="cost-row">
                            <span>售價：</span>
                            <span>NT$ ${product.prices['260g']}</span>
                        </div>
                        <div class="cost-row">
                            <span>成本：</span>
                            <span>NT$ ${cost.cost260}</span>
                        </div>
                        <div class="cost-row">
                            <span>毛利：</span>
                            <span style="color: ${profit260 > 0 ? 'green' : 'red'}">NT$ ${profit260}</span>
                        </div>
                        <div class="cost-row">
                            <span>毛利率：</span>
                            <span style="color: ${margin260 > 30 ? 'green' : margin260 > 15 ? 'orange' : 'red'}">${margin260}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>

            <!-- 成本摘要 -->
            <div class="dashboard-card" style="margin-top: 20px;">
                <h3>📊 成本摘要</h3>
                ${renderCostSummary(costData)}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// 取得成本資料
function getCostData() {
    const saved = localStorage.getItem('product_costs');
    return saved ? JSON.parse(saved) : {};
}

// 儲存成本資料
function saveCostData(costData) {
    localStorage.setItem('product_costs', JSON.stringify(costData));
}

// 編輯成本
function editCost(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const costData = getCostData();
    const currentCost = costData[productId] || { cost120: 0, cost260: 0 };

    const cost120 = prompt(`${product.name} - 120g 成本（目前：NT$ ${currentCost.cost120}）：`, currentCost.cost120);
    if (cost120 === null) return;

    const cost260 = prompt(`${product.name} - 260g 成本（目前：NT$ ${currentCost.cost260}）：`, currentCost.cost260);
    if (cost260 === null) return;

    costData[productId] = {
        cost120: parseFloat(cost120) || 0,
        cost260: parseFloat(cost260) || 0
    };

    saveCostData(costData);
    alert('✅ 成本已更新');
    showCostManagement();
}

// 渲染成本摘要
function renderCostSummary(costData) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    let totalRevenue = 0;
    let totalCost = 0;

    orders.forEach(order => {
        totalRevenue += order.total;
        order.items.forEach(item => {
            const cost = costData[item.productId];
            if (cost) {
                const itemCost = item.size === '120g' ? cost.cost120 : cost.cost260;
                totalCost += itemCost * item.quantity;
            }
        });
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    return `
        <div class="stat-item">
            <strong>總營收</strong>
            <span class="stat-value">NT$ ${totalRevenue.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <strong>總成本</strong>
            <span class="stat-value">NT$ ${totalCost.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <strong>總毛利</strong>
            <span class="stat-value" style="color: ${profit > 0 ? 'green' : 'red'}">NT$ ${profit.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <strong>平均毛利率</strong>
            <span class="stat-value" style="color: ${margin > 30 ? 'green' : margin > 15 ? 'orange' : 'red'}">${margin}%</span>
        </div>
    `;
}

// ==================== 訂單刪除功能 ====================

// 更新 showOrderManagement 函數，加入刪除按鈕
// 這個函數會覆寫 admin-panel.js 中的版本
function showOrderManagementWithDelete() {
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
    orders.forEach((order, index) => {
        const date = new Date(order.timestamp).toLocaleString('zh-TW');
        const itemsText = order.items.map(item =>
            `${item.name} (${item.size}) x ${item.quantity}`
        ).join('<br>');

        ordersHtml += `
            <div class="order-card">
                <div class="order-header">
                    <strong>${order.orderNumber}</strong>
                    <div>
                        <span class="order-date">${date}</span>
                        <button class="btn-danger btn-small" onclick="deleteOrderConfirm(${index}, '${order.orderNumber}')">🗑️ 刪除</button>
                    </div>
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

// 刪除訂單確認
function deleteOrderConfirm(index, orderNumber) {
    if (confirm(`確定要刪除訂單 ${orderNumber} 嗎？\n此操作無法復原！`)) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.splice(index, 1);
        localStorage.setItem('orders', JSON.stringify(orders));
        alert('✅ 訂單已刪除');
        showOrderManagementWithDelete();
    }
}

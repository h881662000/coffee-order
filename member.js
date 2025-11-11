// 會員系統功能

// 會員資料結構
class Member {
    constructor(data) {
        this.id = data.id || Date.now().toString();
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.points = data.points || 0;
        this.totalOrders = data.totalOrders || 0;
        this.totalSpent = data.totalSpent || 0;
        this.level = data.level || 'bronze'; // bronze, silver, gold, platinum
    }
}

// 會員管理
const MemberSystem = {
    // 檢查是否已登入
    isLoggedIn() {
        return !!localStorage.getItem('currentMember');
    },

    // 取得當前登入會員
    getCurrentMember() {
        const memberData = localStorage.getItem('currentMember');
        return memberData ? new Member(JSON.parse(memberData)) : null;
    },

    // 儲存會員資料
    saveMember(member) {
        localStorage.setItem('currentMember', JSON.stringify(member));
    },

    // 註冊會員
    register(memberData) {
        const member = new Member(memberData);
        this.saveMember(member);

        // 儲存到會員資料庫
        let members = this.getAllMembers();
        members.push(member);
        localStorage.setItem('members', JSON.stringify(members));

        return member;
    },

    // 登入
    login(email, phone) {
        const members = this.getAllMembers();
        const member = members.find(m => m.email === email || m.phone === phone);

        if (member) {
            this.saveMember(member);
            return member;
        }
        return null;
    },

    // 登出
    logout() {
        localStorage.removeItem('currentMember');
        updateMemberUI();
    },

    // 取得所有會員
    getAllMembers() {
        const membersData = localStorage.getItem('members');
        return membersData ? JSON.parse(membersData).map(m => new Member(m)) : [];
    },

    // 更新會員資料
    updateMember(memberId, updates) {
        let members = this.getAllMembers();
        const index = members.findIndex(m => m.id === memberId);

        if (index !== -1) {
            members[index] = new Member({ ...members[index], ...updates });
            localStorage.setItem('members', JSON.stringify(members));

            // 如果更新的是當前會員，也更新當前會員資料
            const current = this.getCurrentMember();
            if (current && current.id === memberId) {
                this.saveMember(members[index]);
            }

            return members[index];
        }
        return null;
    },

    // 更新當前會員的個人資料
    updateProfile(updates) {
        const member = this.getCurrentMember();
        if (!member) {
            return { success: false, message: '請先登入' };
        }

        // 檢查 email 是否已被其他會員使用
        if (updates.email && updates.email !== member.email) {
            const members = this.getAllMembers();
            const emailExists = members.find(m => m.id !== member.id && m.email === updates.email);
            if (emailExists) {
                return { success: false, message: 'Email 已被使用' };
            }
        }

        // 檢查電話是否已被其他會員使用
        if (updates.phone && updates.phone !== member.phone) {
            const members = this.getAllMembers();
            const phoneExists = members.find(m => m.id !== member.id && m.phone === updates.phone);
            if (phoneExists) {
                return { success: false, message: '電話號碼已被使用' };
            }
        }

        // 更新資料
        const updatedMember = this.updateMember(member.id, updates);
        if (updatedMember) {
            return { success: true, member: updatedMember };
        }

        return { success: false, message: '更新失敗' };
    },

    // 新增訂單後更新會員資料
    updateMemberAfterOrder(orderId, orderTotal) {
        const member = this.getCurrentMember();
        if (!member) return;

        // 計算獲得的點數（每消費 100 元獲得 1 點）
        const earnedPoints = Math.floor(orderTotal / 100);

        // 更新會員資料
        const updates = {
            totalOrders: member.totalOrders + 1,
            totalSpent: member.totalSpent + orderTotal,
            points: member.points + earnedPoints
        };

        // 根據消費金額更新會員等級
        updates.level = this.calculateMemberLevel(updates.totalSpent);

        this.updateMember(member.id, updates);

        return earnedPoints;
    },

    // 計算會員等級
    calculateMemberLevel(totalSpent) {
        if (totalSpent >= 50000) return 'platinum';
        if (totalSpent >= 20000) return 'gold';
        if (totalSpent >= 5000) return 'silver';
        return 'bronze';
    },

    // 使用點數折抵
    usePoints(points) {
        const member = this.getCurrentMember();
        if (!member || member.points < points) {
            return false;
        }

        this.updateMember(member.id, {
            points: member.points - points
        });

        return true;
    },

    // 取得會員等級資訊
    getLevelInfo(level) {
        const levels = {
            bronze: { name: '銅級會員', discount: 0, color: '#cd7f32' },
            silver: { name: '銀級會員', discount: 0.05, color: '#c0c0c0' },
            gold: { name: '金級會員', discount: 0.10, color: '#ffd700' },
            platinum: { name: '白金會員', discount: 0.15, color: '#e5e4e2' }
        };
        return levels[level] || levels.bronze;
    }
};

// 更新會員 UI
function updateMemberUI() {
    const member = MemberSystem.getCurrentMember();
    const memberArea = document.getElementById('member-area');

    if (!memberArea) return;

    // 如果已登入管理者，不顯示會員資訊
    if (typeof AdminSystem !== 'undefined' && AdminSystem.isLoggedIn()) {
        memberArea.innerHTML = '';
        return;
    }

    if (member) {
        const levelInfo = MemberSystem.getLevelInfo(member.level);
        memberArea.innerHTML = `
            <div class="member-info">
                <span class="member-level" style="color: ${levelInfo.color}">
                    ${levelInfo.name}
                </span>
                <span class="member-name">${member.name}</span>
                <span class="member-points">💰 ${member.points} 點</span>
                <button onclick="showMemberProfile()" class="member-btn">會員中心</button>
                <button onclick="MemberSystem.logout()" class="member-btn">登出</button>
            </div>
        `;
    } else {
        memberArea.innerHTML = `
            <div class="member-info">
                <button onclick="showLoginModal()" class="member-btn">登入</button>
                <button onclick="showRegisterModal()" class="member-btn">註冊</button>
            </div>
        `;
    }
}

// 顯示登入視窗
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 關閉登入視窗
function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 處理登入
async function handleLogin(event) {
    event.preventDefault();

    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;

    // 如果有輸入密碼，先嘗試管理者登入
    if (password) {
        const adminResult = await AdminSystem.login(account, password);

        if (adminResult.success) {
            closeLoginModal();
            alert(`歡迎，管理者 ${AdminSystem.getCurrentAdmin().displayName || account}！`);
            // 顯示管理者面板
            showAdminPanel();
            return;
        }
        // 管理者登入失敗，提示錯誤（不再嘗試會員登入）
        alert('❌ 管理者帳號或密碼錯誤');
        return;
    }

    // 沒有密碼，嘗試會員登入（使用 account 作為 email 或 phone）
    const member = MemberSystem.login(account, account);

    if (member) {
        closeLoginModal();
        updateMemberUI();
        alert(`歡迎回來，${member.name}！`);
    } else {
        alert('找不到會員資料，請確認 Email 或電話是否正確，或先註冊成為會員。');
    }
}

// 顯示註冊視窗
function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 關閉註冊視窗
function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 處理註冊
function handleRegister(event) {
    event.preventDefault();

    const memberData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        phone: document.getElementById('register-phone').value,
        address: document.getElementById('register-address').value
    };

    const member = MemberSystem.register(memberData);

    closeRegisterModal();
    updateMemberUI();
    alert(`註冊成功！歡迎加入，${member.name}！`);

    // 清空表單
    document.getElementById('register-form').reset();
}

// 顯示會員中心
function showMemberProfile() {
    const member = MemberSystem.getCurrentMember();
    if (!member) return;

    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    const levelInfo = MemberSystem.getLevelInfo(member.level);

    document.getElementById('profile-content').innerHTML = `
        <div class="profile-header">
            <h2 style="color: ${levelInfo.color}">${levelInfo.name}</h2>
            <p>${member.name}</p>
        </div>

        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-label">累積點數</div>
                <div class="stat-value">${member.points}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">訂單數量</div>
                <div class="stat-value">${member.totalOrders}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">累積消費</div>
                <div class="stat-value">NT$ ${member.totalSpent.toLocaleString()}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">會員折扣</div>
                <div class="stat-value">${(levelInfo.discount * 100).toFixed(0)}%</div>
            </div>
        </div>

        <div class="profile-info">
            <h3>個人資料</h3>
            <p><strong>Email：</strong>${member.email}</p>
            <p><strong>電話：</strong>${member.phone}</p>
            <p><strong>地址：</strong>${member.address || '未設定'}</p>
            <p><strong>加入日期：</strong>${new Date(member.createdAt).toLocaleDateString('zh-TW')}</p>
        </div>

        <div class="profile-levels">
            <h3>會員等級說明</h3>
            <ul>
                <li>🥉 銅級會員：累積消費 NT$ 0+</li>
                <li>🥈 銀級會員：累積消費 NT$ 5,000+（享 5% 折扣）</li>
                <li>🥇 金級會員：累積消費 NT$ 20,000+（享 10% 折扣）</li>
                <li>💎 白金會員：累積消費 NT$ 50,000+（享 15% 折扣）</li>
            </ul>
        </div>
    `;

    modal.classList.add('active');
}

// 關閉會員中心
function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 自動填入會員資料到結帳表單
function autoFillCheckoutForm() {
    const member = MemberSystem.getCurrentMember();
    if (!member) return;

    document.getElementById('customer-name').value = member.name;
    document.getElementById('customer-phone').value = member.phone;
    document.getElementById('customer-email').value = member.email;
    if (member.address) {
        document.getElementById('customer-address').value = member.address;
    }
}

// 頁面載入時初始化會員 UI
document.addEventListener('DOMContentLoaded', () => {
    updateMemberUI();
});

// 管理員管理功能

// 顯示管理員列表
function renderAdminsList() {
    const listContainer = document.getElementById('admins-list');
    if (!listContainer) return;

    const admins = PermissionSystem.getAllAdmins();
    const currentAdmin = AdminSystem.getCurrentAdmin();

    if (Object.keys(admins).length === 0) {
        listContainer.innerHTML = '<p class="empty-message">目前沒有管理員帳號</p>';
        return;
    }

    let html = '<div class="table-container"><table class="admin-table">';
    html += `
        <thead>
            <tr>
                <th>帳號</th>
                <th>顯示名稱</th>
                <th>權限</th>
                <th>建立時間</th>
                <th>最後登入</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
    `;

    Object.values(admins).forEach(admin => {
        const permissions = admin.permissions || {};
        const permCount = Object.values(permissions).filter(p => p === true).length;
        const isSuperAdmin = admin.isSuperAdmin || false;
        const isCurrentUser = currentAdmin && currentAdmin.username === admin.username;

        // 權限標籤
        let permBadges = '';
        if (isSuperAdmin) {
            permBadges = '<span class="badge badge-super">超級管理員</span>';
        } else if (permCount === 0) {
            permBadges = '<span class="badge badge-none">無權限</span>';
        } else {
            permBadges = `<span class="badge badge-count">${permCount} 個權限</span>`;
        }

        // 操作按鈕
        let actions = '';
        if (!isSuperAdmin) {
            const canEdit = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ADMINS);
            if (canEdit) {
                actions += `<button onclick="editAdmin('${admin.username}')" class="btn-small btn-edit">編輯</button>`;
                if (!isCurrentUser) {
                    actions += `<button onclick="deleteAdmin('${admin.username}')" class="btn-small btn-delete">刪除</button>`;
                }
            }
        } else {
            actions = '<span class="text-muted">系統帳號</span>';
        }

        html += `
            <tr ${isCurrentUser ? 'class="current-user"' : ''}>
                <td>
                    ${admin.username}
                    ${isCurrentUser ? '<span class="badge badge-self">目前登入</span>' : ''}
                </td>
                <td>${admin.displayName || admin.username}</td>
                <td>${permBadges}</td>
                <td>${formatDate(admin.createdAt)}</td>
                <td>${admin.lastLogin ? formatDate(admin.lastLogin) : '<span class="text-muted">從未登入</span>'}</td>
                <td>${actions}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    listContainer.innerHTML = html;
}

// 格式化日期
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 顯示新增管理員表單
function showAddAdminForm() {
    // 檢查權限
    if (!AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ADMINS)) {
        alert('❌ 沒有權限新增管理員');
        return;
    }

    const modal = document.getElementById('admin-form-modal');
    const title = document.getElementById('admin-form-title');
    const submitBtn = document.getElementById('admin-form-submit');
    const usernameInput = document.getElementById('admin-form-username');
    const passwordLabel = document.getElementById('admin-form-password-label');
    const passwordInput = document.getElementById('admin-form-password');
    const passwordHint = document.getElementById('admin-form-password-hint');

    // 重置表單
    document.getElementById('edit-admin-username').value = '';
    document.getElementById('admin-form-username').value = '';
    document.getElementById('admin-form-displayname').value = '';
    document.getElementById('admin-form-password').value = '';
    clearAllPermissions();

    // 設定為新增模式
    title.textContent = '➕ 新增管理員';
    submitBtn.textContent = '➕ 新增管理員';
    usernameInput.disabled = false;
    passwordInput.required = true;
    passwordLabel.textContent = '密碼 *';
    passwordHint.textContent = '至少 6 個字元';

    modal.classList.add('active');
}

// 編輯管理員
function editAdmin(username) {
    // 檢查權限
    if (!AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ADMINS)) {
        alert('❌ 沒有權限編輯管理員');
        return;
    }

    const admin = PermissionSystem.getAdmin(username);
    if (!admin) {
        alert('❌ 找不到該管理員');
        return;
    }

    if (admin.isSuperAdmin) {
        alert('❌ 無法編輯超級管理員');
        return;
    }

    const modal = document.getElementById('admin-form-modal');
    const title = document.getElementById('admin-form-title');
    const submitBtn = document.getElementById('admin-form-submit');
    const usernameInput = document.getElementById('admin-form-username');
    const passwordLabel = document.getElementById('admin-form-password-label');
    const passwordInput = document.getElementById('admin-form-password');
    const passwordHint = document.getElementById('admin-form-password-hint');

    // 填入資料
    document.getElementById('edit-admin-username').value = username;
    document.getElementById('admin-form-username').value = username;
    document.getElementById('admin-form-displayname').value = admin.displayName || '';
    document.getElementById('admin-form-password').value = '';

    // 設定權限
    clearAllPermissions();
    if (admin.permissions) {
        Object.entries(admin.permissions).forEach(([perm, value]) => {
            const checkbox = document.getElementById(`perm-${perm}`);
            if (checkbox) {
                checkbox.checked = value;
            }
        });
    }

    // 設定為編輯模式
    title.textContent = '✏️ 編輯管理員';
    submitBtn.textContent = '💾 儲存變更';
    usernameInput.disabled = true;
    passwordInput.required = false;
    passwordLabel.textContent = '密碼';
    passwordHint.textContent = '留空表示不修改密碼';

    modal.classList.add('active');
}

// 刪除管理員
function deleteAdmin(username) {
    // 檢查權限
    if (!AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ADMINS)) {
        alert('❌ 沒有權限刪除管理員');
        return;
    }

    const admin = PermissionSystem.getAdmin(username);
    if (!admin) {
        alert('❌ 找不到該管理員');
        return;
    }

    if (!confirm(`確定要刪除管理員「${admin.displayName || username}」嗎？\n此操作無法復原。`)) {
        return;
    }

    const result = PermissionSystem.deleteAdmin(AdminSystem.getCurrentAdmin(), username);
    if (result.success) {
        alert('✅ ' + result.message);
        renderAdminsList();
    } else {
        alert('❌ ' + result.message);
    }
}

// 關閉管理員表單
function closeAdminForm() {
    const modal = document.getElementById('admin-form-modal');
    modal.classList.remove('active');
}

// 提交管理員表單
async function submitAdminForm(event) {
    event.preventDefault();

    const editUsername = document.getElementById('edit-admin-username').value;
    const username = document.getElementById('admin-form-username').value.trim();
    const displayName = document.getElementById('admin-form-displayname').value.trim();
    const password = document.getElementById('admin-form-password').value;

    // 驗證
    if (!username || !displayName) {
        alert('❌ 請填寫完整資料');
        return;
    }

    // 收集權限
    const permissions = {};
    Object.values(PermissionSystem.PERMISSIONS).forEach(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        if (checkbox) {
            permissions[perm] = checkbox.checked;
        }
    });

    const currentAdmin = AdminSystem.getCurrentAdmin();

    if (editUsername) {
        // 編輯模式
        const updates = {
            displayName: displayName,
            permissions: permissions
        };

        if (password) {
            if (password.length < 6) {
                alert('❌ 密碼至少需要 6 個字元');
                return;
            }
            updates.password = password;
        }

        const result = await PermissionSystem.updateAdmin(currentAdmin, editUsername, updates);
        if (result.success) {
            alert('✅ ' + result.message);
            closeAdminForm();
            renderAdminsList();

            // 如果編輯的是當前使用者，更新 session
            if (editUsername === currentAdmin.username) {
                alert('⚠️ 您已修改自己的權限，請重新登入以套用變更');
                AdminSystem.logout();
                closeAdminPanel();
            }
        } else {
            alert('❌ ' + result.message);
        }
    } else {
        // 新增模式
        if (!password) {
            alert('❌ 請輸入密碼');
            return;
        }

        if (password.length < 6) {
            alert('❌ 密碼至少需要 6 個字元');
            return;
        }

        const result = await PermissionSystem.addAdmin(currentAdmin, {
            username: username,
            password: password,
            displayName: displayName,
            permissions: permissions
        });

        if (result.success) {
            alert('✅ ' + result.message);
            closeAdminForm();
            renderAdminsList();
        } else {
            alert('❌ ' + result.message);
        }
    }
}

// 全選權限
function selectAllPermissions() {
    Object.values(PermissionSystem.PERMISSIONS).forEach(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

// 清除所有權限
function clearAllPermissions() {
    Object.values(PermissionSystem.PERMISSIONS).forEach(perm => {
        const checkbox = document.getElementById(`perm-${perm}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    });
}

// 更新管理員標籤的顯示（根據權限）
function updateAdminTabVisibility() {
    const adminTab = document.getElementById('admin-tab-admins');
    const addAdminBtn = document.getElementById('add-admin-btn');

    if (!AdminSystem.isLoggedIn()) {
        if (adminTab) adminTab.style.display = 'none';
        return;
    }

    const hasPermission = AdminSystem.hasPermission(PermissionSystem.PERMISSIONS.MANAGE_ADMINS);

    // 只有擁有 MANAGE_ADMINS 權限的人才能看到管理員管理標籤
    if (adminTab) {
        adminTab.style.display = hasPermission ? 'block' : 'none';
    }

    // 新增按鈕也要檢查權限
    if (addAdminBtn) {
        addAdminBtn.style.display = hasPermission ? 'inline-block' : 'none';
    }
}

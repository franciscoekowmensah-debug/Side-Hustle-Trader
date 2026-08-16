document.addEventListener('DOMContentLoaded', () => {
    // Hide spinner once loaded
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.classList.remove('show');
    }

    // Verify Admin Status
    fetch('/api/admin/check')
        .then(res => {
            if (!res.ok) {
                window.location.href = '/home.html';
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                loadDashboardData();
            }
        })
        .catch(err => {
            console.error(err);
            window.location.href = '/home.html';
        });

    // Handle Change Password Form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const current_password = document.getElementById('current-password').value;
            const new_password = document.getElementById('new-password').value;
            const confirm_password = document.getElementById('confirm-password').value;

            if (new_password !== confirm_password) {
                showToast('New passwords do not match.', 'warning');
                return;
            }

            fetch('/api/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password, new_password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Password changed successfully!', 'success');
                    changePasswordForm.reset();
                } else {
                    showToast(data.error || 'Failed to update password.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Error updating password.', 'error');
            });
        });
    }
});

function loadDashboardData() {
    loadUsers();
    loadDeposits();
}

function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load users: ${data.error}</td></tr>`;
                return;
            }

            const users = data.users;
            document.getElementById('stat-total-users').innerText = users.length;

            if (users.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No registered users found.</td></tr>`;
                return;
            }

            let html = '';
            users.forEach(user => {
                const roleBadge = user.is_admin 
                    ? `<span class="badge bg-danger">Admin</span>` 
                    : `<span class="badge bg-secondary">User</span>`;
                
                html += `
                    <tr>
                        <td><strong>#${user.id}</strong></td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>GHC ${user.balance.toFixed(2)}</td>
                        <td>GHC ${user.earnings.toFixed(2)}</td>
                        <td>${user.invites_count}</td>
                        <td>${roleBadge}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-info text-white me-1" onclick="viewUserDetails(${user.id})">
                                <i class="fa fa-eye"></i> Details
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUserAccount(${user.id}, '${user.name}')">
                                <i class="fa fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error retrieving user list.</td></tr>`;
        });
}

function loadDeposits() {
    const tableBody = document.getElementById('deposits-table-body');
    fetch('/api/admin/deposits')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load deposits: ${data.error}</td></tr>`;
                return;
            }

            const deposits = data.deposits;
            const pendingCount = deposits.filter(d => d.status === 'pending').length;
            const completedCount = deposits.filter(d => d.status === 'completed').length;

            document.getElementById('stat-pending-deposits').innerText = pendingCount;
            document.getElementById('stat-completed-deposits').innerText = completedCount;

            if (deposits.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No deposit transactions found.</td></tr>`;
                return;
            }

            let html = '';
            deposits.forEach(deposit => {
                let statusBadge = '';
                let actionButtons = '';

                if (deposit.status === 'pending') {
                    statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
                    actionButtons = `
                        <button class="btn btn-sm btn-success text-white me-1" onclick="approveDeposit(${deposit.id})">
                            <i class="fa fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectDeposit(${deposit.id})">
                            <i class="fa fa-times"></i> Reject
                        </button>
                    `;
                } else if (deposit.status === 'completed') {
                    statusBadge = `<span class="badge bg-success">Approved</span>`;
                    actionButtons = `<span class="text-muted">Approved</span>`;
                } else {
                    statusBadge = `<span class="badge bg-danger">Rejected</span>`;
                    actionButtons = `<span class="text-muted">Rejected</span>`;
                }

                const formattedDate = new Date(deposit.date_created).toLocaleString();

                html += `
                    <tr>
                        <td><strong>#${deposit.id}</strong></td>
                        <td>${deposit.user_name}</td>
                        <td>${deposit.user_email}</td>
                        <td><strong>GHC ${deposit.amount.toFixed(2)}</strong></td>
                        <td><code>${deposit.wallet_address}</code></td>
                        <td>${formattedDate}</td>
                        <td>${statusBadge}</td>
                        <td class="text-end">${actionButtons}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error retrieving deposit list.</td></tr>`;
        });
}

function viewUserDetails(userId) {
    const modalBody = document.getElementById('user-details-modal-body');
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Fetching user details...</p>
        </div>
    `;

    const myModal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    myModal.show();

    fetch(`/api/admin/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                modalBody.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
                return;
            }

            const user = data.user;
            
            // Format arrays
            const paymentMethodsHtml = user.payment_methods.length === 0 
                ? '<p class="text-muted">No saved payment methods.</p>' 
                : `<ul class="list-group">
                    ${user.payment_methods.map(m => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><strong>${m.method_type.toUpperCase()}</strong>: ${m.provider} - Acc: ${m.account_number} (${m.account_name})</span>
                        </li>
                    `).join('')}
                   </ul>`;

            const investmentsHtml = user.investments.length === 0 
                ? '<p class="text-muted">No investments made.</p>' 
                : `<ul class="list-group">
                    ${user.investments.map(i => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><strong>${i.plan_name}</strong> - Amount: GHC ${i.amount} (Yield: GHC ${i.daily_return}/day)</span>
                            <span class="badge bg-primary rounded-pill">${new Date(i.date_created).toLocaleDateString()}</span>
                        </li>
                    `).join('')}
                   </ul>`;

            const withdrawalsHtml = user.withdrawals.length === 0 
                ? '<p class="text-muted">No withdrawal requests.</p>' 
                : `<ul class="list-group">
                    ${user.withdrawals.map(w => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>Amount: GHC ${w.amount} - Status: <strong>${w.status}</strong></span>
                            <span class="badge bg-secondary rounded-pill">${new Date(w.date_created).toLocaleDateString()}</span>
                        </li>
                    `).join('')}
                   </ul>`;

            modalBody.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <h6>Basic Details</h6>
                        <table class="table table-bordered">
                            <tr><th>Name</th><td>${user.name}</td></tr>
                            <tr><th>Email</th><td>${user.email}</td></tr>
                            <tr><th>Nickname</th><td>${user.nickname || '-'}</td></tr>
                            <tr><th>Phone</th><td>${user.phone || '-'}</td></tr>
                            <tr><th>Country</th><td>${user.country || '-'}</td></tr>
                            <tr><th>DOB</th><td>${user.dob || '-'}</td></tr>
                            <tr><th>Tier Level</th><td>${user.tier_level}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Financial Summary</h6>
                        <table class="table table-bordered">
                            <tr><th>Current Balance</th><td><strong>GHC ${user.balance.toFixed(2)}</strong></td></tr>
                            <tr><th>Total Earnings</th><td>GHC ${user.earnings.toFixed(2)}</td></tr>
                            <tr><th>Invites Count</th><td>${user.invites_count}</td></tr>
                        </table>
                        
                        <h6 class="mt-4">Payment Options</h6>
                        ${paymentMethodsHtml}
                    </div>
                    <div class="col-12 mt-3">
                        <hr>
                        <h6>Investments History</h6>
                        ${investmentsHtml}
                        
                        <h6 class="mt-4">Withdrawals History</h6>
                        ${withdrawalsHtml}
                    </div>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            modalBody.innerHTML = `<div class="alert alert-danger">Failed to load user info.</div>`;
        });
}

function deleteUserAccount(userId, userName) {
    if (confirm(`Are you absolutely sure you want to delete the account for "${userName}"? This action cannot be undone!`)) {
        fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    loadDashboardData();
                } else {
                    showToast(data.error || 'Failed to delete account.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Error deleting account.', 'error');
            });
    }
}

function approveDeposit(depositId) {
    if (confirm('Approve this deposit request? This will credit the user\'s balance.')) {
        fetch(`/api/admin/deposits/approve/${depositId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    loadDashboardData();
                } else {
                    showToast(data.error || 'Approval failed.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Error approving deposit.', 'error');
            });
    }
}

function rejectDeposit(depositId) {
    if (confirm('Are you sure you want to reject this deposit request?')) {
        fetch(`/api/admin/deposits/reject/${depositId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    loadDashboardData();
                } else {
                    showToast(data.error || 'Rejection failed.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Error rejecting deposit.', 'error');
            });
    }
}

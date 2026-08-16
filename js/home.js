document.addEventListener('DOMContentLoaded', () => {
    loadDashboardDetails();

    // Yield return simulation button
    const simulateYieldBtn = document.getElementById('simulate-yield-btn');
    if (simulateYieldBtn) {
        simulateYieldBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/api/earnings/tick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    loadDashboardDetails();
                } else {
                    showToast(data.error || 'Simulation tick failed.', 'error');
                }
            })
            .catch(err => console.error(err));
        });
    }

    // Confirm withdrawal button
    const confirmWithdrawBtn = document.getElementById('confirm-withdraw-btn');
    if (confirmWithdrawBtn) {
        confirmWithdrawBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('withdraw-amount').value);
            const paymentMethodId = document.getElementById('withdraw-payment-method').value;

            if (isNaN(amount) || amount <= 0) {
                showToast('Please enter a valid withdrawal amount.', 'warning');
                return;
            }

            if (!paymentMethodId) {
                showToast('Please select a payment method. If you do not have one, configure it in your profile.', 'warning');
                return;
            }

            fetch('/api/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, paymentMethodId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    // Reset input
                    document.getElementById('withdraw-amount').value = '';
                    
                    // Close bootstrap modal
                    const modalEl = document.getElementById('withdrawModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                    
                    loadDashboardDetails();
                } else {
                    showToast(data.error || 'Withdrawal failed.', 'error');
                }
            })
            .catch(err => console.error(err));
        });
    }
});

function loadDashboardDetails() {
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                
                // Update text displays
                document.getElementById('user-balance').textContent = user.balance.toFixed(2);
                document.getElementById('user-earnings').textContent = user.earnings.toFixed(2);
                document.getElementById('user-tier').textContent = user.tier_level || 'Level 1';
                document.getElementById('user-referrals').textContent = user.invites_count || 0;
                
                // Modal balance display
                document.getElementById('modal-available-balance').textContent = user.balance.toFixed(2);

                // Populate withdrawal payment methods selection
                populateWithdrawalMethods(user.payment_methods);
            }
        })
        .catch(err => console.error('Dashboard load failed:', err));
}

function populateWithdrawalMethods(methods) {
    const selectEl = document.getElementById('withdraw-payment-method');
    if (!selectEl) return;

    // Save the current selection value
    const currentVal = selectEl.value;

    // Reset dropdown
    selectEl.innerHTML = '<option value="">-- Select Saved Method --</option>';

    if (methods && methods.length > 0) {
        methods.forEach(method => {
            const typeLabel = method.method_type === 'momo' ? 'MoMo' : (method.method_type === 'card' ? 'Card' : 'Crypto');
            const option = document.createElement('option');
            option.value = method.id;
            option.textContent = `${typeLabel} - ${method.provider} (${method.account_number})`;
            selectEl.appendChild(option);
        });

        // Restore selection if still valid
        selectEl.value = currentVal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfileDetails();
    setupPaymentTypeToggle();

    // Copy Crypto Wallet Address
    const copyWalletBtn = document.getElementById('copy-wallet-btn');
    if (copyWalletBtn) {
        copyWalletBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const walletInput = document.getElementById('company-wallet-addr');
            walletInput.select();
            navigator.clipboard.writeText(walletInput.value)
                .then(() => {
                    showToast('Wallet address copied to clipboard!', 'success');
                })
                .catch(err => {
                    showToast('Failed to copy address.', 'error');
                });
        });
    }

    // Identity Info Save Button
    const saveIdentityBtn = document.getElementById('save-identity-btn');
    if (saveIdentityBtn) {
        saveIdentityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const phone = document.getElementById('phone').value;
            const dob = document.getElementById('DoB').value;
            const country = document.querySelector('select[name="country"]').value;

            updateProfile({
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                dob: dob,
                country: country
            });
        });
    }

    // Social Info Save Button
    const saveSocialBtn = document.getElementById('save-social-btn');
    if (saveSocialBtn) {
        saveSocialBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nickname = document.getElementById('nick-name').value;
            updateProfile({ nickname });
        });
    }

    // Save Mobile Money Account
    const addMomoBtn = document.getElementById('add-momo-btn');
    if (addMomoBtn) {
        addMomoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = document.getElementById('momo-provider').value;
            const number = document.getElementById('momo-number').value.trim();
            const name = document.getElementById('momo-name').value.trim();

            if (!number || !name) {
                showToast('Please fill in all MoMo fields.', 'warning');
                return;
            }

            savePaymentMethod({
                method_type: 'momo',
                provider: provider,
                account_number: number,
                account_name: name
            });
        });
    }

    // Save Bank Card Details
    const addCardBtn = document.getElementById('add-card-btn');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = document.getElementById('card-provider').value;
            const number = document.getElementById('card-number').value.trim();
            const name = document.getElementById('card-name').value.trim();
            const expiry = document.getElementById('card-expiry').value.trim();
            const cvv = document.getElementById('card-cvv').value.trim();

            if (!number || !name || !expiry || !cvv) {
                showToast('Please fill in all card fields.', 'warning');
                return;
            }

            savePaymentMethod({
                method_type: 'card',
                provider: provider,
                account_number: number,
                account_name: name,
                expiry_date: expiry,
                cvv: cvv
            });
        });
    }

    // Confirm Cryptocurrency Deposit ("I have paid")
    const cryptoConfirmBtn = document.getElementById('crypto-confirm-btn');
    if (cryptoConfirmBtn) {
        cryptoConfirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('crypto-amount').value);
            const wallet = document.getElementById('company-wallet-addr').value;

            if (isNaN(amount) || amount <= 0) {
                showToast('Please enter a valid deposit amount.', 'warning');
                return;
            }

            fetch('/api/deposit/crypto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, wallet_address: wallet })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    document.getElementById('crypto-amount').value = '';
                    loadProfileDetails();
                } else {
                    showToast(data.error || 'Failed to submit deposit confirmation.', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Failed to process crypto deposit.', 'error');
            });
        });
    }
});

function setupPaymentTypeToggle() {
    const paymentTypeSelect = document.getElementById('payment-type');
    if (paymentTypeSelect) {
        paymentTypeSelect.addEventListener('change', () => {
            const selectedType = paymentTypeSelect.value;
            
            // Hide all field containers
            document.querySelectorAll('.payment-method-fields').forEach(container => {
                container.style.display = 'none';
            });
            
            // Show selected container
            if (selectedType === 'momo') {
                document.getElementById('momo-fields').style.display = 'block';
            } else if (selectedType === 'card') {
                document.getElementById('card-fields').style.display = 'block';
            } else if (selectedType === 'crypto') {
                document.getElementById('crypto-fields').style.display = 'block';
            }
        });
    }
}

function loadProfileDetails() {
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                
                // Populate Identity fields
                document.getElementById('first-name').value = user.first_name || '';
                document.getElementById('last-name').value = user.last_name || '';
                document.getElementById('e-mail').value = user.email || '';
                document.getElementById('e-mail').readOnly = true;
                document.getElementById('phone').value = user.phone || '';
                document.getElementById('DoB').value = user.dob || '';
                
                const countrySelect = document.querySelector('select[name="country"]');
                if (countrySelect && user.country) {
                    countrySelect.value = user.country;
                }

                // Populate Social fields
                document.getElementById('nick-name').value = user.nickname || '';

                // Populate Payment methods
                renderPaymentMethods(user.payment_methods);

                // Populate Investments & Withdrawals
                renderInvestments(user.investments);
                renderWithdrawals(user.withdrawals);
            }
        })
        .catch(err => console.error('Error loading profile details:', err));
}

function updateProfile(fields) {
    fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Profile settings saved successfully!', 'success');
            loadProfileDetails();
        } else {
            showToast(data.error || 'Failed to update profile.', 'error');
        }
    })
    .catch(err => console.error(err));
}

function savePaymentMethod(payload) {
    fetch('/api/payment/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Payment method saved!', 'success');
            // Clear inputs
            if (payload.method_type === 'momo') {
                document.getElementById('momo-number').value = '';
                document.getElementById('momo-name').value = '';
            } else {
                document.getElementById('card-number').value = '';
                document.getElementById('card-name').value = '';
                document.getElementById('card-expiry').value = '';
                document.getElementById('card-cvv').value = '';
            }
            loadProfileDetails();
        } else {
            showToast(data.error || 'Failed to save payment option.', 'error');
        }
    })
    .catch(err => console.error(err));
}

function renderPaymentMethods(methods) {
    const listDiv = document.getElementById('saved-payment-methods');
    if (!listDiv) return;

    if (!methods || methods.length === 0) {
        listDiv.innerHTML = '<p class="text-muted">No saved payment methods yet.</p>';
        return;
    }

    let html = '<div class="list-group">';
    methods.forEach(method => {
        let typeLabel = '';
        let detailsStr = '';
        if (method.method_type === 'momo') {
            typeLabel = `MoMo (${method.provider})`;
            detailsStr = `No: ${method.account_number} | Holder: ${method.account_name}`;
        } else if (method.method_type === 'card') {
            typeLabel = `Card (${method.provider})`;
            // Mask card details except last 4
            const maskedCard = method.account_number.replace(/\d(?=\d{4})/g, "*");
            detailsStr = `No: ${maskedCard} | Exp: ${method.expiry_date} | Holder: ${method.account_name}`;
        }
        
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${typeLabel}</strong><br>
                    <span class="text-muted">${detailsStr}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deletePaymentMethod(${method.id})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
    });
    html += '</div>';
    listDiv.innerHTML = html;
}

function deletePaymentMethod(id) {
    // Use UI confirm dialog instead of native confirm
    confirmDialog('Are you sure you want to delete this payment method?').then(confirmed => {
        if (!confirmed) return;

        fetch(`/api/payment/delete/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('Payment method deleted.', 'success');
                loadProfileDetails();
            } else {
                showToast(data.error || 'Failed to delete payment method.', 'error');
            }
        })
        .catch(err => console.error(err));
    });
}

function renderInvestments(investments) {
    const listDiv = document.getElementById('investments-list');
    if (!listDiv) return;

    if (!investments || investments.length === 0) {
        listDiv.innerHTML = '<p class="text-muted">No active investments yet. Go to the Invest page to begin.</p>';
        return;
    }

    let html = '<ul class="list-group">';
    investments.forEach(inv => {
        const dateStr = new Date(inv.date_created).toLocaleDateString();
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${inv.plan_name} Plan</strong><br>
                    <span class="text-muted">Invested: GHC ${inv.amount} | Yield Return: GHC ${inv.daily_return}/daily</span>
                </div>
                <span class="badge bg-success rounded-pill">Active (${dateStr})</span>
            </li>
        `;
    });
    html += '</ul>';
    listDiv.innerHTML = html;
}

function renderWithdrawals(withdrawals) {
    const listDiv = document.getElementById('withdrawals-list');
    if (!listDiv) return;

    if (!withdrawals || withdrawals.length === 0) {
        listDiv.innerHTML = '<p class="text-muted">No withdrawals requested yet.</p>';
        return;
    }

    let html = '<ul class="list-group">';
    withdrawals.forEach(w => {
        const dateStr = new Date(w.date_created).toLocaleDateString();
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>Withdrew GHC ${w.amount}</strong><br>
                    <span class="text-muted">Requested on ${dateStr}</span>
                </div>
                <span class="badge bg-info rounded-pill">${w.status.toUpperCase()}</span>
            </li>
        `;
    });
    html += '</ul>';
    listDiv.innerHTML = html;
}

window.deletePaymentMethod = deletePaymentMethod;

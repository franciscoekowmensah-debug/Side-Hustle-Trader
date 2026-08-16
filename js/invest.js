document.addEventListener('DOMContentLoaded', () => {
    loadUserBalance();

    const planPrices = {
        'Regular': 150,
        'Silver': 200,
        'Bronze': 270,
        'Gold': 360,
        'Diamond': 500
    };

    // Find all investment plan buttons
    const planButtons = document.querySelectorAll('.blog-item a.btn-primary');
    planButtons.forEach(btn => {
        // Change href to # to prevent page reload
        btn.setAttribute('href', '#');
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const planName = btn.textContent.trim();
            const amount = planPrices[planName];

            if (!planName || !amount) {
                showToast('Invalid investment plan selected.', 'error');
                return;
            }

            confirmDialog(`Are you sure you want to invest GHC ${amount} in the ${planName} plan?`).then(confirmed => {
                if (!confirmed) return;

                fetch('/api/invest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan_name: planName, amount: amount })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast(data.message, 'success');
                        loadUserBalance();
                    } else {
                        showToast(data.error || 'Failed to complete investment.', 'error');
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast('An error occurred processing your investment.', 'error');
                });
            });
        });
    });
});

function loadUserBalance() {
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('user-balance').textContent = data.user.balance.toFixed(2);
            }
        })
        .catch(err => console.error('Error fetching balance:', err));
}

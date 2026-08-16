document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                
                // Update invite count
                const inviteCountEl = document.getElementById('invite-count');
                if (inviteCountEl) {
                    inviteCountEl.textContent = user.invites_count || 0;
                }

                // Generate referral link
                const refLinkEl = document.getElementById('referral-link');
                if (refLinkEl) {
                    const refUrl = `${window.location.origin}/login.html?ref=${user.id}`;
                    refLinkEl.value = refUrl;
                }
            }
        })
        .catch(err => console.error('Error fetching invite data:', err));

    // Copy referral link button
    const copyBtn = document.getElementById('copy-ref-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const refLinkEl = document.getElementById('referral-link');
            if (refLinkEl && refLinkEl.value) {
                refLinkEl.select();
                refLinkEl.setSelectionRange(0, 99999); // For mobile devices
                
                navigator.clipboard.writeText(refLinkEl.value)
                    .then(() => {
                        showToast('Referral link copied to clipboard!', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        showToast('Failed to copy. Please manually copy the link text.', 'error');
                    });
            }
        });
    }
});

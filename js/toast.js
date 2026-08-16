// Custom Toast Notification System
(function() {
    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '99999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.maxWidth = '350px';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info') {
        const container = createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.fontWeight = '500';
        toast.style.fontFamily = "'Open Sans', sans-serif";
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'between';
        toast.style.minWidth = '250px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';

        // Color theme mapping
        let bgColor = '#17a2b8'; // info
        let icon = 'info-circle';
        if (type === 'success') {
            bgColor = '#2dca73';
            icon = 'check-circle';
        } else if (type === 'error') {
            bgColor = '#e74c3c';
            icon = 'exclamation-circle';
        } else if (type === 'warning') {
            bgColor = '#f39c12';
            icon = 'exclamation-triangle';
        }

        toast.style.backgroundColor = bgColor;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                <i class="fas fa-${icon}" style="font-size: 18px;"></i>
                <div style="flex-grow: 1;">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Animation in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 50);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Expose globally
    window.showToast = showToast;
})();

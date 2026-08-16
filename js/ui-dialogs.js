// Small reusable UI dialog system (confirm + alert)
(function(){
    function createContainer(){
        let c = document.getElementById('ui-dialog-container');
        if (!c){
            c = document.createElement('div');
            c.id = 'ui-dialog-container';
            c.style.position = 'fixed';
            c.style.left = '0';
            c.style.top = '0';
            c.style.width = '100%';
            c.style.height = '100%';
            c.style.zIndex = '200000';
            c.style.pointerEvents = 'none';
            document.body.appendChild(c);
        }
        return c;
    }

    function buildDialogHtml(title, message, options){
        return `
            <div class="ui-dialog-overlay" style="position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;pointer-events:auto;">
                <div class="ui-dialog" role="dialog" aria-modal="true" style="background:#fff;border-radius:10px;max-width:520px;width:90%;box-shadow:0 20px 50px rgba(0,0,0,0.35);overflow:hidden;font-family:Open Sans, Roboto, Arial, sans-serif;">
                    <div style="padding:18px 20px;border-bottom:1px solid #f1f1f1;background:#fbfbfb;">
                        <strong style="font-size:16px;color:#333;">${title}</strong>
                    </div>
                    <div style="padding:18px 20px;">
                        <div style="color:#444;font-size:14px;line-height:1.45;">${message}</div>
                    </div>
                    <div style="padding:12px 16px;border-top:1px solid #f1f1f1;display:flex;gap:8px;justify-content:flex-end;background:#fff;">
                        ${options}
                    </div>
                </div>
            </div>
        `;
    }

    function confirmDialog(message, title = 'Confirm'){
        return new Promise(resolve => {
            const container = createContainer();
            const okId = 'ui-dialog-ok-'+Date.now();
            const cancelId = 'ui-dialog-cancel-'+Date.now();
            const options = `
                <button id="${cancelId}" class="btn btn-light" style="min-width:100px;">Cancel</button>
                <button id="${okId}" class="btn btn-primary" style="min-width:100px;">Confirm</button>
            `;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = buildDialogHtml(title, message, options);

            // attach
            container.appendChild(wrapper);

            const okBtn = wrapper.querySelector('#'+okId);
            const cancelBtn = wrapper.querySelector('#'+cancelId);
            const overlay = wrapper.querySelector('.ui-dialog-overlay');

            function cleanUp(result){
                try{ wrapper.remove(); }catch(e){}
                resolve(result);
            }

            okBtn.addEventListener('click', () => cleanUp(true));
            cancelBtn.addEventListener('click', () => cleanUp(false));

            // close on overlay click (treat as cancel)
            overlay.addEventListener('click', (ev) => {
                if (ev.target === overlay) cleanUp(false);
            });

            // keyboard handlers
            const keyHandler = (ev) => {
                if (ev.key === 'Escape') { cleanUp(false); }
                if (ev.key === 'Enter') { cleanUp(true); }
            };
            document.addEventListener('keydown', keyHandler);

            // Ensure we remove key listener after cleanup
            const originalResolve = resolve;
            resolve = (result) => { document.removeEventListener('keydown', keyHandler); originalResolve(result); };
        });
    }

    function alertDialog(message, title = 'Notice'){
        return new Promise(resolve => {
            const container = createContainer();
            const okId = 'ui-dialog-ok-'+Date.now();
            const options = `<button id="${okId}" class="btn btn-primary" style="min-width:100px;">OK</button>`;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = buildDialogHtml(title, message, options);
            container.appendChild(wrapper);

            const okBtn = wrapper.querySelector('#'+okId);
            const overlay = wrapper.querySelector('.ui-dialog-overlay');

            function cleanUp(){ try{ wrapper.remove(); }catch(e){} resolve(); }

            okBtn.addEventListener('click', cleanUp);
            overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cleanUp(); });
            document.addEventListener('keydown', function kd(ev){ if (ev.key === 'Escape' || ev.key === 'Enter'){ cleanUp(); document.removeEventListener('keydown', kd); } });
        });
    }

    window.confirmDialog = confirmDialog;
    window.alertDialog = alertDialog;
})();

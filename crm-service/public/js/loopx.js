(function() {
    const scriptTag = document.currentScript;
    const orgId = new URL(scriptTag.src).searchParams.get('org');
    const API_BASE = scriptTag.src.split('/js/')[0];

    if (!orgId) {
        console.error('[LoopX] Missing org parameter in script source.');
        return;
    }

    async function init() {
        try {
            const response = await fetch(`${API_BASE}/popups/${orgId}`);
            const popups = await response.json();
            popups.forEach(setupPopup);
        } catch (err) {
            console.error('[LoopX] Failed to fetch popups:', err);
        }
    }

    function setupPopup(popup) {
        const config = popup.popUpConfig;
        const storageKey = `loopx_shown_${popup.id}`;

        if (config.frequency === 'ONCE_PER_SESSION' && sessionStorage.getItem(storageKey)) {
            return;
        }

        switch (config.trigger) {
            case 'TIME':
                setTimeout(() => showPopup(popup), config.triggerValue * 1000);
                break;
            case 'SCROLL':
                const onScroll = () => {
                    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                    if (scrolled >= config.triggerValue) {
                        showPopup(popup);
                        window.removeEventListener('scroll', onScroll);
                    }
                };
                window.addEventListener('scroll', onScroll);
                break;
            case 'EXIT_INTENT':
                const onMouseOut = (e) => {
                    if (e.clientY <= 0) {
                        showPopup(popup);
                        document.removeEventListener('mouseleave', onMouseOut);
                    }
                };
                document.addEventListener('mouseleave', onMouseOut);
                break;
        }
    }

    function showPopup(popup) {
        // 1. Create Container & Shadow DOM
        const container = document.createElement('div');
        container.id = `loopx-popup-${popup.id}`;
        document.body.appendChild(container);
        const shadow = container.attachShadow({ mode: 'closed' });

        // 2. Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .loopx-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); display: flex; align-items: center;
                justify-content: center; z-index: 999999; font-family: sans-serif;
            }
            .loopx-modal {
                background: white; padding: 2rem; border-radius: 8px;
                max-width: 500px; width: 90%; position: relative;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            .loopx-close {
                position: absolute; top: 10px; right: 10px; cursor: pointer;
                border: none; background: none; font-size: 20px; color: #666;
            }
            .loopx-form input {
                width: 100%; padding: 10px; margin-bottom: 10px;
                border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
            }
            .loopx-form button {
                width: 100%; padding: 10px; background: #007bff;
                color: white; border: none; border-radius: 4px; cursor: pointer;
            }
            .loopx-success { color: green; text-align: center; }
        `;
        shadow.appendChild(style);

        // 3. Inject HTML
        const overlay = document.createElement('div');
        overlay.className = 'loopx-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'loopx-modal';
        modal.innerHTML = `
            <button class="loopx-close">&times;</button>
            ${popup.htmlContent || `
                <h3>${popup.name}</h3>
                <form class="loopx-form">
                    ${popup.fieldsConfig.map(f => `
                        <input type="${f.type}" name="${f.name}" placeholder="${f.label}" ${f.required ? 'required' : ''} />
                    `).join('')}
                    <button type="submit">Subscribe</button>
                </form>
            `}
            <div class="loopx-status"></div>
        `;

        overlay.appendChild(modal);
        shadow.appendChild(overlay);

        // 4. Events
        modal.querySelector('.loopx-close').onclick = () => container.remove();
        
        const form = modal.querySelector('form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const statusDiv = modal.querySelector('.loopx-status');

                try {
                    const res = await fetch(`${API_BASE}/forms/${popup.id}/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await res.json();
                    if (res.ok) {
                        modal.innerHTML = `<div class="loopx-success">${popup.successMessage}</div>`;
                        setTimeout(() => container.remove(), 3000);
                    } else {
                        statusDiv.innerHTML = `<small style="color:red">${result.error}</small>`;
                    }
                } catch (err) {
                    statusDiv.innerHTML = `<small style="color:red">Submission failed</small>`;
                }
            };
        }

        // 5. Track Impression
        fetch(`${API_BASE}/forms/${popup.id}/impression`, { method: 'POST' });
        
        // 6. Mark as shown
        sessionStorage.setItem(storageKey, 'true');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

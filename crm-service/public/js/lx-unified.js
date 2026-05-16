// crm-service/public/js/lx-unified.js
(function(window) {
    const INGESTION_API = 'http://localhost:3000';
    
    class LoopXUnified {
        constructor() {
            this.orgId = null;
            this.apiBase = null;
            this.consentGiven = false;
            this.eventQueue = [];
            this.init();
        }

        init() {
            const scriptTag = document.currentScript;
            if (scriptTag && scriptTag.src) {
                const url = new URL(scriptTag.src);
                this.orgId = url.searchParams.get('org');
                this.apiBase = scriptTag.src.split('/js/')[0];
            }

            if (!this.orgId) {
                console.error('[LoopX] Missing org parameter in script source.');
                return;
            }

            // Check if consent was previously given
            if (this.get('lx_consent') === 'true') {
                this.consentGiven = true;
                this.processQueue();
                this.storeAttributionTokens();
            }

            // Init Popups (Popups don't require tracking consent)
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initPopups();
                    this.setupHoneyPot();
                });
            } else {
                this.initPopups();
                this.setupHoneyPot();
            }
        }

        setupHoneyPot() {
            const link = document.createElement('a');
            link.href = '#';
            link.style.display = 'none';
            link.style.position = 'absolute';
            link.style.left = '-9999px';
            link.setAttribute('aria-hidden', 'true');
            link.setAttribute('tabindex', '-1');
            link.onclick = (e) => {
                e.preventDefault();
                this.persist('lx_is_bot', 'true');
                this.track('bot_detected', { reason: 'honeypot_clicked' });
            };
            document.body.appendChild(link);
        }

        confirmConsent() {
            this.consentGiven = true;
            this.persist('lx_consent', 'true');
            this.storeAttributionTokens();
            this.processQueue();
        }

        storeAttributionTokens() {
            if (!this.consentGiven) return;
            const urlParams = new URLSearchParams(window.location.search);
            const lx_cid = urlParams.get('lx_cid');
            const lx_sid = urlParams.get('lx_sid');

            if (lx_cid) this.persist('lx_cid', lx_cid);
            if (lx_sid) this.persist('lx_sid', lx_sid);
        }

        persist(key, value) {
            localStorage.setItem(key, value);
            const domain = window.location.hostname.split('.').slice(-2).join('.');
            const expires = new Date();
            expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
            document.cookie = `${key}=${value}; expires=${expires.toUTCString()}; path=/; domain=.${domain}; SameSite=Lax`;
        }

        get(key) {
            let val = localStorage.getItem(key);
            if (val) return val;
            const name = key + "=";
            const decodedCookie = decodeURIComponent(document.cookie);
            const ca = decodedCookie.split(';');
            for(let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }
            return null;
        }

        async track(eventName, metadata = {}) {
            if (!this.orgId) return;

            const payload = {
                eventName,
                metadata: {
                    ...metadata,
                    url: window.location.href,
                    device: navigator.userAgent
                }
            };

            if (!this.consentGiven) {
                this.eventQueue.push(payload);
                return;
            }

            this._sendTrack(payload);
        }

        async _sendTrack(payload) {
            const campaignId = this.get('lx_cid');
            const userId = this.get('lx_sid');

            if (!campaignId || !userId) return;

            const apiPayload = {
                orgId: this.orgId,
                userId: userId,
                event_type: payload.eventName,
                channel: 'EMAIL',
                campaignId: campaignId,
                metadata: {
                    ...payload.metadata,
                    is_bot: this.get('lx_is_bot') === 'true'
                }
            };

            try {
                await fetch(`${INGESTION_API}/track-event`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-api-key': 'public-tracker-key' 
                    },
                    body: JSON.stringify(apiPayload)
                });
            } catch (err) {
                console.error('[LoopX] Track event failed', err);
            }
        }

        processQueue() {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                this._sendTrack(event);
            }
        }

        async initPopups() {
            try {
                const response = await fetch(`${this.apiBase}/popups/${this.orgId}`);
                if (!response.ok) return;
                const popups = await response.json();
                popups.forEach(p => this.setupPopup(p));
            } catch (err) {
                console.error('[LoopX] Failed to fetch popups');
            }
        }

        setupPopup(popup) {
            const config = popup.popUpConfig;
            const storageKey = `loopx_shown_${popup.id}`;

            if (config.frequency === 'ONCE_PER_SESSION' && sessionStorage.getItem(storageKey)) {
                return;
            }

            switch (config.trigger) {
                case 'TIME':
                    setTimeout(() => this.showPopup(popup, storageKey), config.triggerValue * 1000);
                    break;
                case 'SCROLL':
                    const onScroll = () => {
                        const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                        if (scrolled >= config.triggerValue) {
                            this.showPopup(popup, storageKey);
                            window.removeEventListener('scroll', onScroll);
                        }
                    };
                    window.addEventListener('scroll', onScroll);
                    break;
                case 'EXIT_INTENT':
                    const onMouseOut = (e) => {
                        if (e.clientY <= 0) {
                            this.showPopup(popup, storageKey);
                            document.removeEventListener('mouseleave', onMouseOut);
                        }
                    };
                    document.addEventListener('mouseleave', onMouseOut);
                    break;
            }
        }

        showPopup(popup, storageKey) {
            const container = document.createElement('div');
            container.id = `loopx-popup-${popup.id}`;
            document.body.appendChild(container);
            const shadow = container.attachShadow({ mode: 'closed' });

            const style = document.createElement('style');
            style.textContent = `
                .loopx-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999999; font-family: sans-serif; }
                .loopx-modal { background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
                .loopx-close { position: absolute; top: 10px; right: 10px; cursor: pointer; border: none; background: none; font-size: 20px; color: #666; }
                .loopx-form input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                .loopx-form button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .loopx-success { color: green; text-align: center; }
            `;
            shadow.appendChild(style);

            const overlay = document.createElement('div');
            overlay.className = 'loopx-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'loopx-modal';
            modal.innerHTML = `
                <button class="loopx-close">&times;</button>
                ${popup.htmlContent || `
                    <h3>${popup.name}</h3>
                    <form class="loopx-form">
                        ${popup.fieldsConfig.map(f => `<input type="${f.type}" name="${f.name}" placeholder="${f.label}" ${f.required ? 'required' : ''} />`).join('')}
                        <button type="submit">Subscribe</button>
                    </form>
                `}
                <div class="loopx-status"></div>
            `;

            overlay.appendChild(modal);
            shadow.appendChild(overlay);

            modal.querySelector('.loopx-close').onclick = () => container.remove();
            
            const form = modal.querySelector('form');
            if (form) {
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    const statusDiv = modal.querySelector('.loopx-status');

                    try {
                        const res = await fetch(`${this.apiBase}/forms/${popup.id}/submit`, {
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

            fetch(`${this.apiBase}/forms/${popup.id}/impression`, { method: 'POST' }).catch(()=>{});
            sessionStorage.setItem(storageKey, 'true');
        }
    }

    window.LoopX = new LoopXUnified();
})(window);
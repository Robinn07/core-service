(function() {
    const scriptTag = document.currentScript;
    const orgId = new URL(scriptTag.src).searchParams.get('org');
    const API_BASE = scriptTag.src.split('/js/')[0];

    if (!orgId) {
        console.error('[lx-unified] Missing org parameter.');
        return;
    }

    const storageKey = 'lx_consent_token';

    async function updateConsent(subscriberId, granted) {
        try {
            const response = await fetch(`${API_BASE}/api/track/consent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriberId, granted, consentType: 'GDPR_TRACKING' })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem(storageKey, data.token);
                console.log('[lx-unified] Consent token updated.');
            }
        } catch (err) {
            console.error('[lx-unified] Failed to update consent:', err);
        }
    }

    function getConsentToken() {
        return localStorage.getItem(storageKey);
    }

    // Attach to window for global access
    window.lx = {
        updateConsent,
        getConsentToken,
        trackEvent: (eventType, data) => {
            const token = getConsentToken();
            if (!token) {
                console.warn('[lx-unified] No valid consent token found. Event might be rejected.');
            }
            // Logic to send event to ingestion-service or track endpoint
            // For now, it just demonstrates token usage.
        }
    };

    console.log('[lx-unified] SDK Initialized.');
})();

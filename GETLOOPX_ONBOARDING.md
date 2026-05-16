# GetLoopX Success Gap Onboarding & Security Guide

To successfully launch the "Success Gap" attribution engine and ensure your data remains accurate and secure, please follow these technical requirements.

## 1. Client-Side Implementation
Add the following script tag to the `<head>` of your website. Replace `YOUR_ORG_ID` with your actual organization ID.

```html
<script 
  src="https://crm.yourdomain.com/js/lx-unified.js?org=YOUR_ORG_ID" 
  async>
</script>
```

### GDPR / CCPA Compliance (Consent)
Our tracker is strictly consent-aware. It will NOT store attribution cookies or send product events to our ingestion API until the user explicitly consents. 

When a user accepts your site's cookie policy, call:
```javascript
window.LoopX.confirmConsent();
```
*Note: Any events tracked prior to consent will be securely queued in memory and dispatched immediately upon calling `confirmConsent()`.*

### Event Tracking
To track product milestones (conversions), use the `window.LoopX.track` method:

```javascript
// Example: Tracking a 'Team Member Invited' event
window.LoopX.track('invited_teammate', {
  plan_type: 'Pro',
  source: 'dashboard_v2'
});
```

## 2. Security Configuration (CORS & CSP)

### Content Security Policy (CSP)
If your site uses a Content Security Policy, you MUST add GetLoopX domains to your whitelist. Add the following directives to your CSP header:

*   **`script-src`**: `https://crm.yourdomain.com`
*   **`connect-src`**: `https://ingestion.yourdomain.com` (Port 3000)

### Authorized Origins
Provide your website's domain in the GetLoopX dashboard under **Settings > Ingestion**. Events from unauthorized domains will be rejected by our security layer.

## 3. Cross-Subdomain Tracking
Our tracker automatically uses **top-level cookies** (e.g., `.example.com`) to ensure that if a user lands on `promo.example.com` but converts on `app.example.com`, the attribution is preserved. No additional configuration is required.

## 4. Attribution Logic
By default, we use an **Adaptive Attribution Window**. This means we analyze your historical conversion data to determine the most accurate time-frame for attribution. 

*   **Cold Start:** For new accounts, we default to a **48-hour window**. You can override this in **Settings > Analytics**.

## 5. Dashboard ROI
Once configured, you will see a new **Success Rate** metric in your Campaign Analytics. This metric represents the percentage of users who clicked an email and performed your defined "Success Event" within the attribution window.
# GetLoopX CRM Intelligence Engine

Enterprise Audience Management & AI-Powered Marketing Automation.

## 🚀 AI Capabilities Integrated
This service includes 6 core intelligence modules:
1. **Churn Prediction**: Forecasts subscriber unsubscribe probability.
2. **Send-Time Optimization (STO)**: Determines optimal email delivery hours.
3. **Lead Scoring**: Dynamic engagement-based categorization (COLD/WARM/HOT).
4. **AI Segmentation**: Intelligent behavioral clustering.
5. **Campaign Recommendations**: Data-driven audience and timing advice.
6. **Anomaly Detection**: Automated circuit breakers for bounce/fraud spikes.

## 🛠 For Frontend Engineers
### 1. API Documentation
The entire API is documented via Swagger. Once the server is running, visit:
`http://localhost:4000/api-docs`

### 2. Key Endpoints for UI Development
- `GET /api/ai/sto/recommendation/:campaignId`: Get advice for a campaign draft.
- `POST /api/ai/leads/score`: Trigger lead scoring for a subscriber.
- `POST /api/ai/churn/predict`: Run churn analysis.
- `POST /api/track/click/:logId`: The endpoint used for link tracking (backend usage).

### 3. Real-time Events (Socket.io)
The backend emits real-time alerts to the `orgId` room:
- `campaign:anomaly`: Triggered when a campaign is automatically paused.
- `anomaly:click_fraud`: Triggered when bot behavior is detected.

## 🧪 A/B Testing Framework
The system supports automated A/B testing for both **Subject Lines** and **HTML Content**.

### How to configure an A/B Test:
When creating a campaign (`POST /api/campaigns`), use `type: "AB_TEST"` and provide an `abTestConfig`:

```json
{
  "type": "AB_TEST",
  "abTestConfig": {
    "variantA": { 
      "subject": "Subject A", 
      "templateId": "uuid-1" 
    },
    "variantB": { 
      "subject": "Subject B", 
      "templateId": "uuid-2" 
    },
    "testSize": 20,          // % of audience to test (split 50/50 between A and B)
    "testDuration": 4,      // Hours to wait before picking a winner
    "testMetric": "open_count", // "open_count" or "click_count"
    "fallbackVariant": "A"  // Variant to use if no engagement is recorded
  }
}
```

### Automation Workflow:
1. **Testing Phase**: The system sends Variant A and B to the test group. Campaign status becomes `TESTING`.
2. **Evaluation**: After `testDuration`, the `pick-winner` job evaluates the engagement rate.
3. **Rollout**: The winner is selected, and the campaign resumes for the remaining audience using the winning variant.
4. **Analytics**: Use `GET /api/campaigns/:id/analytics` to see the detailed performance breakdown of each variant.

## ⚙️ Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in local credentials.
3. `npx sequelize-cli db:migrate`
4. `npm run dev`

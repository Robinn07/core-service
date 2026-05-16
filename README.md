# GetLoopX: AI-Powered CRM & Behavioral Intelligence Engine

GetLoopX is an enterprise-grade platform that bridges the **"Success Gap"** between marketing communication and product-led growth. It combines traditional CRM capabilities with advanced behavioral analytics and AI-driven automation.

## 🏗 System Architecture

The project is architected as a set of high-performance microservices:

1.  **CRM Service (Port 4000):** The core dashboard and campaign engine (Node.js/Express/Postgres).
2.  **Ingestion Gateway (Port 3000):** High-velocity event ingestion layer (Node.js/RabbitMQ).
3.  **Analytics Engine (Port 8000):** Behavioral intelligence and ROI attribution (FastAPI/Retentioneering/ClickHouse).
4.  **Ingestion Worker:** Asynchronous event processor (Python/ClickHouse).
5.  **Email Service:** Dedicated mailing infrastructure (Node.js/SES).

---

## 📂 Service & File Breakdown

### 1. CRM Service (`/crm-service`)
Manages the user interface, campaign orchestration, and relational data.

*   **`src/controllers/`**: Core business logic.
    *   `campaignController.js`: Manages campaign lifecycle, A/B testing, and success-gap reporting.
    *   `trackingController.js`: Handles email opens/clicks with built-in bot detection.
    *   `aiController.js`: Interface for churn prediction and send-time optimization.
    *   `automationController.js`: Orchestrates multi-tier behavioral triggers.
*   **`src/models/`**: Sequelize database schemas.
    *   `Campaign.js`: Stores campaign configurations and success milestone definitions.
    *   `EventLog.js`: Persistent record of all engagement activities.
    *   `Subscriber.js`: Customer profiles with dynamic lead scores and AI segments.
*   **`src/workers/`**: Background task processing.
    *   `webhookWorker.js`: Reliable webhook delivery with exponential backoff and Redis-based Circuit Breakers.
*   **`public/js/lx-unified.js`**: The client-side SDK. Combines interactive popups with GDPR-compliant, consent-aware behavioral tracking.

### 2. Ingestion Service (`/retentioneering/ingestion-service`)
A performance-optimized gateway for raw behavioral data.

*   **`server.js`**: Receives events via HTTP (including S2S API) and pushes them to RabbitMQ. Includes CORS protection and API key caching.
*   **`worker.py`**: The heavy lifter. Batches incoming RabbitMQ messages (100 events / 5s) and writes them to ClickHouse. Implements backpressure to protect database I/O.
*   **`auth.js`**: Firebase-backed authentication with Redis caching for high-scale validation.

### 3. Analytics Service (`/retentioneering/analytics-service`)
The intelligence layer powered by Retentioneering.

*   **`main.py`**: FastAPI entry point for the intelligence suite.
*   **`services/attribution_engine.py`**: The "Success Gap" logic. Uses ClickHouse native queries and adaptive windows to calculate the true ROI of every campaign.
*   **`services/path_discovery.py`**: Identifies "Toxic Paths" (sequences leading to churn) and "Golden Paths" (sequences leading to success).
*   **`services/health.py`**: Calculates real-time user engagement and churn risk scores.

### 4. Database & Infrastructure
*   **`retentioneering/setup_clickhouse.py`**: Manages the OLAP schema. Implements monthly partitioning and a 90-day Data TTL policy for hardware preservation.
*   **`ecosystem.config.js`**: PM2 configuration for cluster-mode deployment and resource management.

---

## 🚀 Key "Survival" Features

*   **Success Gap Engine:** Automatically joins email engagement with product-led milestones using high-performance ClickHouse ASOF-style joins.
*   **Bot/Malware Shield:** A 2-second velocity filter and Honey Pot trap within the SDK to ensure ROI metrics aren't poisoned by scanners.
*   **Infrastructure Backpressure:** Auto-throttling ingestion workers when ClickHouse I/O pressure is high to prevent "Write Ahead Log" exhaustion.
*   **Fault-Tolerant Webhooks:** Dedicted BullMQ workers with Circuit Breakers to prevent slow external servers from stalling the core CRM.
*   **Hardware Preservation:** Native 90-day data expiry at the database layer to prevent hard drive saturation at 1000+ concurrent user scale.

---

## 🛠 Setup & Installation

See the [GETLOOPX_ONBOARDING.md](./GETLOOPX_ONBOARDING.md) for detailed client-side integration instructions and CSP configurations.

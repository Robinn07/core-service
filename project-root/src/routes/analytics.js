const express = require('express');
const axios = require('axios');
const authenticateTenant = require('../middleware/auth');
const router = express.Router();

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8081';

/**
 * Proxy route to fetch analytics from the Python service.
 * This ensures the dashboard doesn't need to know the Python service URL 
 * and handles internal authentication.
 */
router.get('/:type', authenticateTenant, async (req, res) => {
  const { type } = req.params;
  const { tenantId } = req;
  const campaignId = req.query.campaignId || 'GLOBAL';
  
  // Forward the Authorization header (Firebase Token) to the Python service
  const authHeader = req.headers.authorization;

  try {
    let url = `${ANALYTICS_SERVICE_URL}/analytics/${tenantId}/${type}`;
    if (type === 'abtest' || type === 'summary' || type === 'dashboard') {
      url = `${ANALYTICS_SERVICE_URL}/analytics/${tenantId}/${type}/${campaignId}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: authHeader
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(`❌ Analytics Proxy Error (${type}):`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch analytics from engine",
      details: error.response?.data
    });
  }
});

module.exports = router;

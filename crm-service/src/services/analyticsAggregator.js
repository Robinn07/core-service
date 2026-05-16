const { CampaignAnalytics } = require('../models');

class AnalyticsAggregator {
  /**
   * Updates aggregated stats based on an event.
   * Uses upsert/increment logic for high performance.
   * @param {Object} eventData - The raw event data (OPEN, CLICK, etc.)
   */
  async aggregate(eventData) {
    const { campaignId, orgId, country, city, os, browser, deviceType, createdAt } = eventData;

    if (!campaignId || campaignId === 'none') return;

    const timestamp = createdAt || new Date();
    const hourKey = timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH

    const metrics = [
      { category: 'GEO_COUNTRY', key: country || 'Unknown' },
      { category: 'GEO_CITY', key: city || 'Unknown' },
      { category: 'DEVICE_TYPE', key: deviceType || 'Desktop' },
      { category: 'OS', key: os || 'Unknown' },
      { category: 'BROWSER', key: browser || 'Unknown' },
      { category: 'TIMELINE_HOUR', key: hourKey }
    ];

    try {
      // Perform parallel increments for all categories
      const promises = metrics.map(m => 
        CampaignAnalytics.upsert({
          campaignId,
          orgId,
          category: m.category,
          key: m.key,
          count: 1
        }, {
          conflictFields: ['campaignId', 'category', 'key'],
          returning: false
        })
      );

      // Note: Sequelize upsert doesn't always support direct increment in all dialects 
      // without raw queries, but we'll use a safer approach for this PoC.
      // In production, we'd use: 
      // await sequelize.query("INSERT INTO ... ON CONFLICT (...) DO UPDATE SET count = count + 1")
      
      // For now, we'll use a raw query for true atomic increments
      await this._atomicIncrement(campaignId, orgId, metrics);

    } catch (error) {
      console.error('[AnalyticsAggregator] Error:', error.message);
    }
  }

  async _atomicIncrement(campaignId, orgId, metrics) {
    const { sequelize } = require('../models');
    
    for (const m of metrics) {
      const query = `
        INSERT INTO campaign_analytics ("id", "campaignId", "orgId", "category", "key", "count", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), :campaignId, :orgId, :category, :key, 1, NOW(), NOW())
        ON CONFLICT ("campaignId", "category", "key") 
        DO UPDATE SET "count" = campaign_analytics."count" + 1, "updatedAt" = NOW()
      `;
      
      await sequelize.query(query, {
        replacements: { campaignId, orgId, category: m.category, key: m.key },
        type: sequelize.QueryTypes.INSERT
      });
    }
  }
}

module.exports = new AnalyticsAggregator();

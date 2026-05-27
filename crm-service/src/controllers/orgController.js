const { OrgConfig } = require('../models');

exports.getSettings = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    let config = await OrgConfig.findOne({ where: { orgId } });
    
    // If not exists, return default
    if (!config) {
      config = await OrgConfig.create({
        orgId,
        ingestionKey: `ingest_${Date.now()}`
      });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { orgName, supportEmail, physicalAddress, timezone, defaultFromName, logoUrl } = req.body;
    
    let config = await OrgConfig.findOne({ where: { orgId } });
    if (!config) {
      config = await OrgConfig.create({
        orgId,
        ingestionKey: `ingest_${Date.now()}`
      });
    }

    await config.update({
      orgName,
      supportEmail,
      physicalAddress,
      timezone,
      defaultFromName,
      logoUrl
    });

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { Template } = require('../models');

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, htmlContent, mjmlContent, designData } = req.body;
    const template = await Template.create({
      name,
      subject,
      htmlContent,
      mjmlContent,
      designData,
      orgId: req.user.orgId
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { orgId: req.user.orgId }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: { id: req.params.id, orgId: req.user.orgId }
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, htmlContent, mjmlContent, designData } = req.body;
    
    const template = await Template.findOne({
      where: { id, orgId: req.user.orgId }
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    await template.update({
      name,
      subject,
      htmlContent,
      mjmlContent,
      designData
    });

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

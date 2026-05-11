const { Form } = require('../models');

exports.createForm = async (req, res) => {
  try {
    const { name, listId, fieldsConfig, successMessage } = req.body;
    const orgId = req.user?.orgId || req.headers['x-org-id'];

    const form = await Form.create({
      orgId,
      name,
      listId,
      fieldsConfig,
      successMessage
    });

    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const forms = await Form.findAll({ where: { orgId } });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const { name, listId, fieldsConfig, successMessage, isActive } = req.body;

    const form = await Form.findOne({ where: { id, orgId } });
    if (!form) return res.status(404).json({ error: 'Form not found' });

    await form.update({ name, listId, fieldsConfig, successMessage, isActive });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

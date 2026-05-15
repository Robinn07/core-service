const { Automation, AutomationAction } = require('../models');
const automationService = require('../services/automationService');

exports.createAutomation = async (req, res) => {
  try {
    const { name, triggerType, triggerConfig, actions } = req.body;
    const automation = await Automation.create({ 
      name, 
      triggerType, 
      triggerConfig,
      orgId: req.user.orgId 
    });

    if (actions && actions.length > 0) {
      for (const action of actions) {
        await AutomationAction.create({
          ...action,
          automationId: automation.id
        });
      }
    }

    const fullAutomation = await Automation.findByPk(automation.id, {
      include: [{ model: AutomationAction, as: 'actions' }]
    });

    res.status(201).json(fullAutomation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllAutomations = async (req, res) => {
  try {
    const automations = await Automation.findAll({
      where: { orgId: req.user.orgId },
      include: [{ model: AutomationAction, as: 'actions' }]
    });
    res.json(automations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerAutomation = async (req, res) => {
  try {
    const { eventName, subscriberId } = req.body;
    const orgId = req.user.orgId;

    if (!eventName || !subscriberId) {
      return res.status(400).json({ error: 'eventName and subscriberId are required' });
    }

    await automationService.trigger(orgId, 'event_occurred', {
      subscriberId,
      eventType: eventName
    });

    res.json({ status: 'triggered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerPathAutomation = async (req, res) => {
  try {
    const { pathId, subscriberId, orgId } = req.body;

    if (!pathId || !subscriberId || !orgId) {
      return res.status(400).json({ error: 'pathId, subscriberId, and orgId are required' });
    }

    await automationService.trigger(orgId, 'path_discovered', {
      subscriberId,
      pathId
    });

    res.json({ status: 'path_triggered', pathId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCanvas = async (req, res) => {
  const { id } = req.params;
  const { canvasState, actions } = req.body;
  const { sequelize } = require('../models');

  const transaction = await sequelize.transaction();

  try {
    const automation = await Automation.findOne({
      where: { id, orgId: req.user.orgId }
    });

    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // 1. Update Automation canvasState
    await automation.update({ canvasState }, { transaction });

    // 2. Clear existing actions
    await AutomationAction.destroy({
      where: { automationId: id },
      transaction
    });

    // 3. Rebuild actions
    if (actions && actions.length > 0) {
      for (const actionData of actions) {
        await AutomationAction.create({
          ...actionData,
          automationId: id
        }, { transaction });
      }
    }

    await transaction.commit();

    const updatedAutomation = await Automation.findByPk(id, {
      include: [{ model: AutomationAction, as: 'actions' }]
    });

    res.json(updatedAutomation);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

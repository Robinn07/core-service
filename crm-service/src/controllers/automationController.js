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

const { Automation, AutomationAction, Subscriber, EventLog } = require('../models');
const automationQueue = require('../queue/automationQueue');
const { Op } = require('sequelize');

class AutomationService {
  /**
   * Trigger automations based on an event
   */
  async trigger(orgId, triggerType, context) {
    const { subscriberId, eventType } = context;

    const query = {
      where: { orgId, triggerType, active: true },
      include: [{ model: AutomationAction, as: 'actions', order: [['order', 'ASC']] }]
    };

    // Special handling for behavioral events
    if (triggerType === 'event_occurred' && eventType) {
      query.where.triggerConfig = { eventName: eventType };
    } else if (triggerType === 'path_discovered' && context.pathId) {
      query.where.triggerConfig = { pathId: context.pathId };
    }

    const automations = await Automation.findAll(query);

    for (const auto of automations) {
      // Find the first action
      const firstAction = auto.actions.find(a => a.order === 1);
      if (firstAction) {
        await this.queueAction(firstAction.id, subscriberId);
      }
    }
  }

  /**
   * Queue an action to be processed
   */
  async queueAction(actionId, subscriberId, delay = 0) {
    await automationQueue.add('process-action', {
      actionId,
      subscriberId
    }, {
      delay: delay * 1000 // BullMQ expects milliseconds
    });
  }

  /**
   * Execute a specific action logic
   */
  async executeAction(actionId, subscriberId) {
    const action = await AutomationAction.findByPk(actionId);
    const subscriber = await Subscriber.findByPk(subscriberId);

    if (!action || !subscriber) return;

    let conditionMet = true;

    // 1. Core Logic based on Type
    if (action.type === 'send_email') {
      const emailQueue = require('../queue/emailQueue');
      await emailQueue.add('automation-email', {
        templateId: action.config.templateId,
        subscriberId: subscriber.id,
        orgId: subscriber.orgId
      });
    } else if (action.type === 'add_tag') {
      const { Tag } = require('../models');
      const [tag] = await Tag.findOrCreate({ where: { name: action.config.tagName, orgId: subscriber.orgId } });
      await subscriber.addTag(tag);
    } else if (action.type === 'remove_tag') {
      const { Tag } = require('../models');
      const tag = await Tag.findOne({ where: { name: action.config.tagName, orgId: subscriber.orgId } });
      if (tag) await subscriber.removeTag(tag);
    } else if (action.type === 'update_property') {
      const { field, value } = action.config;
      if (['firstName', 'lastName', 'email'].includes(field)) {
        subscriber[field] = value;
      } else {
        subscriber.attributes = { ...subscriber.attributes, [field]: value };
      }
      await subscriber.save();
    } else if (action.type === 'copy_to_list') {
      const { listId } = action.config;
      await subscriber.addList(listId);
    } else if (action.type === 'move_to_list') {
      const { fromListId, toListId } = action.config;
      if (fromListId) await subscriber.removeList(fromListId);
      await subscriber.addList(toListId);
    } else if (action.type === 'unsubscribe') {
      subscriber.status = 'unsubscribed';
      await subscriber.save();
    } else if (action.type === 'send_webhook') {
      const { url, payload } = action.config;
      const axios = require('axios');
      try {
        await axios.post(url, { ...payload, subscriberId: subscriber.id, email: subscriber.email }, { timeout: 5000 });
      } catch (err) {
        console.error(`Automation Webhook Failed: ${err.message}`);
      }
    } else if (action.type === 'split') {
      conditionMet = await this._evaluateCondition(action.config, subscriber);
    }

    // 2. Queue Next Step
    const nextStepId = conditionMet ? action.nextActionId : action.falseActionId;
    
    if (nextStepId) {
      const nextAction = await AutomationAction.findByPk(nextStepId);
      if (nextAction) {
        let waitDelay = 0;
        let actualNextId = nextStepId;

        if (nextAction.type === 'wait') {
          if (nextAction.config.waitType === 'until_date') {
            const targetDate = new Date(nextAction.config.untilDate);
            const now = new Date();
            waitDelay = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
          } else {
            // Default to relative wait (seconds)
            const waitAmount = nextAction.config.waitAmount || 0;
            const waitUnit = nextAction.config.waitUnit || 'seconds';
            const unitMultipliers = {
              seconds: 1,
              minutes: 60,
              hours: 3600,
              days: 86400
            };
            waitDelay = waitAmount * (unitMultipliers[waitUnit] || 1);
          }
          // The 'wait' action itself doesn't "do" anything but delay the next one
          actualNextId = nextAction.nextActionId;
        }

        if (actualNextId) {
          await this.queueAction(actualNextId, subscriberId, waitDelay);
        }
      }
    }
  }

  async _evaluateCondition(config, subscriber) {
    const { type, operator, field, value, tagName, campaignId, listId } = config;

    switch (type) {
      case 'has_tag':
        const tags = await subscriber.getTags();
        return tags.some(t => t.name === tagName);

      case 'is_in_list':
        const lists = await subscriber.getLists();
        return lists.some(l => l.id === listId);

      case 'opened_email':
        return (await EventLog.count({
          where: { subscriberId: subscriber.id, type: 'OPEN', campaignId }
        })) > 0;

      case 'clicked_link':
        return (await EventLog.count({
          where: { subscriberId: subscriber.id, type: 'CLICK', campaignId }
        })) > 0;

      case 'field_value':
        const actualValue = subscriber[field] || (subscriber.attributes && subscriber.attributes[field]);
        if (operator === 'equals') return String(actualValue) === String(value);
        if (operator === 'contains') return String(actualValue).includes(String(value));
        if (operator === 'greater_than') return Number(actualValue) > Number(value);
        if (operator === 'less_than') return Number(actualValue) < Number(value);
        return false;

      case 'lead_score':
        if (operator === 'greater_than') return subscriber.leadScore > Number(value);
        if (operator === 'less_than') return subscriber.leadScore < Number(value);
        return false;

      default:
        return false;
    }
  }
}

module.exports = new AutomationService();

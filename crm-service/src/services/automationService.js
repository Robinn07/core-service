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
    } else if (action.type === 'split') {
      conditionMet = await this._evaluateCondition(action.config, subscriber);
    }

    // 2. Queue Next Step
    const nextStepId = conditionMet ? action.nextActionId : action.falseActionId;
    
    if (nextStepId) {
      const nextAction = await AutomationAction.findByPk(nextStepId);
      if (nextAction) {
        // Handle 'wait' type as a specific delay for the NEXT action
        const waitDelay = nextAction.type === 'wait' ? (nextAction.config.seconds || 0) : 0;
        const actualNextId = nextAction.type === 'wait' ? nextAction.nextActionId : nextStepId;
        
        if (actualNextId) {
            await this.queueAction(actualNextId, subscriberId, waitDelay);
        }
      }
    }
  }

  async _evaluateCondition(config, subscriber) {
    if (config.type === 'has_tag') {
        const tags = await subscriber.getTags();
        return tags.some(t => t.name === config.tagName);
    }
    if (config.type === 'opened_email') {
        const count = await EventLog.count({
            where: {
                subscriberId: subscriber.id,
                type: 'OPEN',
                campaignId: config.campaignId
            }
        });
        return count > 0;
    }
    return false;
  }
}

module.exports = new AutomationService();

const automationService = require('./automationService');
const appEmitter = require('../utils/events');

class AutomationTriggerService {
  constructor() {
    this.initListeners();
  }

  initListeners() {
    appEmitter.on('subscriber_created', (subscriber) => this.onSubscriberCreated(subscriber));
    appEmitter.on('list_joined', ({ subscriber, listId }) => this.onListJoined(subscriber, listId));
    appEmitter.on('tag_added', ({ subscriber, tagName }) => this.onTagAdded(subscriber, tagName));
    appEmitter.on('event_occurred', ({ subscriber, eventType, metadata }) => this.onEventOccurred(subscriber, eventType, metadata));
    appEmitter.on('unsubscribed', (subscriber) => this.onUnsubscribed(subscriber));
    appEmitter.on('field_changed', ({ subscriber, field, oldValue, newValue }) => this.onFieldChanged(subscriber, field, oldValue, newValue));
  }

  /**
   * Called when a subscriber is created
   */
  async onSubscriberCreated(subscriber) {
    await automationService.trigger(subscriber.orgId, 'subscriber_created', {
      subscriberId: subscriber.id
    });
  }

  /**
   * Called when a subscriber joins a list
   */
  async onListJoined(subscriber, listId) {
    await automationService.trigger(subscriber.orgId, 'list_joined', {
      subscriberId: subscriber.id,
      listId
    });
  }

  /**
   * Called when a tag is added to a subscriber
   */
  async onTagAdded(subscriber, tagName) {
    await automationService.trigger(subscriber.orgId, 'tag_added', {
      subscriberId: subscriber.id,
      tagName
    });
  }

  /**
   * Called when a behavioral event occurs (opened, clicked, etc.)
   */
  async onEventOccurred(subscriber, eventType, metadata = {}) {
    await automationService.trigger(subscriber.orgId, 'event_occurred', {
      subscriberId: subscriber.id,
      eventType,
      metadata
    });

    // Also trigger specific Mailercloud-style triggers
    if (eventType === 'OPEN') {
      await automationService.trigger(subscriber.orgId, 'email_opened', {
        subscriberId: subscriber.id,
        campaignId: metadata.campaignId
      });
    } else if (eventType === 'CLICK') {
      await automationService.trigger(subscriber.orgId, 'link_clicked', {
        subscriberId: subscriber.id,
        campaignId: metadata.campaignId,
        url: metadata.url
      });
    }
  }

  /**
   * Called when a subscriber unsubscribes
   */
  async onUnsubscribed(subscriber) {
    await automationService.trigger(subscriber.orgId, 'unsubscribed', {
      subscriberId: subscriber.id
    });
  }

  /**
   * Called when a field value changes
   */
  async onFieldChanged(subscriber, field, oldValue, newValue) {
    await automationService.trigger(subscriber.orgId, 'field_changed', {
      subscriberId: subscriber.id,
      field,
      oldValue,
      newValue
    });
  }
}

module.exports = new AutomationTriggerService();

const Subscriber = require('./Subscriber');
const List = require('./List');
const Tag = require('./Tag');
const Template = require('./Template');
const Campaign = require('./Campaign');
const CampaignLog = require('./CampaignLog');
const Automation = require('./Automation');
const AutomationAction = require('./AutomationAction');
const EventLog = require('./EventLog');
const Domain = require('./Domain');
const WebhookSubscription = require('./WebhookSubscription');
const ApiKey = require('./ApiKey');
const Form = require('./Form');
const SuppressionList = require('./SuppressionList');
const OrgConfig = require('./OrgConfig');
const ConsentLog = require('./ConsentLog');
const UserRole = require('./UserRole');
const CampaignAnalytics = require('./CampaignAnalytics');

// Subscriber <-> List (Many-to-Many)
Subscriber.belongsToMany(List, { through: 'list_subscribers' });
List.belongsToMany(Subscriber, { through: 'list_subscribers' });

// Subscriber <-> Tag (Many-to-Many)
Subscriber.belongsToMany(Tag, { through: 'subscriber_tags' });
Tag.belongsToMany(Subscriber, { through: 'subscriber_tags' });

// Campaign Relationships
Template.hasMany(Campaign, { foreignKey: 'templateId' });
Campaign.belongsTo(Template, { foreignKey: 'templateId' });

Campaign.hasMany(CampaignLog, { foreignKey: 'campaignId' });
CampaignLog.belongsTo(Campaign, { foreignKey: 'campaignId' });

Subscriber.hasMany(CampaignLog, { foreignKey: 'subscriberId' });
CampaignLog.belongsTo(Subscriber, { foreignKey: 'subscriberId' });

// EventLog Relationships
Campaign.hasMany(EventLog, { foreignKey: 'campaignId' });
EventLog.belongsTo(Campaign, { foreignKey: 'campaignId' });

Subscriber.hasMany(EventLog, { foreignKey: 'subscriberId' });
EventLog.belongsTo(Subscriber, { foreignKey: 'subscriberId' });

// Suppression Join Association
Subscriber.hasOne(SuppressionList, { foreignKey: 'email', sourceKey: 'email', as: 'Suppression' });

// Automation Relationships
Automation.hasMany(AutomationAction, { foreignKey: 'automationId', as: 'actions' });
AutomationAction.belongsTo(Automation, { foreignKey: 'automationId' });

Template.hasMany(AutomationAction, { foreignKey: 'templateId' });
AutomationAction.belongsTo(Template, { foreignKey: 'templateId' });

// Subscriber <-> ConsentLog (One-to-Many)
Subscriber.hasMany(ConsentLog, { foreignKey: 'subscriberId', as: 'consentLogs' });
ConsentLog.belongsTo(Subscriber, { foreignKey: 'subscriberId' });

module.exports = {
  Subscriber,
  List,
  Tag,
  Template,
  Campaign,
  CampaignLog,
  Automation,
  AutomationAction,
  EventLog,
  Domain,
  WebhookSubscription,
  ApiKey,
  Form,
  SuppressionList,
  OrgConfig,
  ConsentLog,
  UserRole,
  CampaignAnalytics
};

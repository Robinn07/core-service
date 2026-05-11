// email-service/src/services/schemaValidator.js

const Joi = require('joi');

const VALID_EVENTS = {
  email:    ['email_sent','email_delivered','email_opened','link_clicked','bounced','unsubscribed','spam_reported'],
  sms:      ['sms_sent','sms_delivered','link_clicked','replied','unsubscribed'],
  whatsapp: ['whatsapp_sent','whatsapp_delivered','whatsapp_read','replied','link_clicked','unsubscribed'],
  push:     ['push_sent','push_delivered','push_clicked','push_dismissed'],
};

const eventSchema = Joi.object({
  org_id:      Joi.string().required(),
  user_id:     Joi.string().required(),
  event_type:  Joi.string().required(),
  channel:     Joi.string().valid('email','sms','whatsapp','push').required(),
  campaign_id: Joi.string().required(),
  ab_variant:  Joi.string().valid('A','B').allow(null).default(null),
  metadata:    Joi.object({
    device:   Joi.string().optional(),
    country:  Joi.string().optional(),
    link_url: Joi.string().uri().optional(),
  }).default({}),
});

function validateEvent(payload) {
  const { error, value } = eventSchema.validate(payload, { abortEarly: false });

  if (error) {
    return { valid: false, error: error.details.map(d => d.message).join(', ') };
  }

  const allowed = VALID_EVENTS[value.channel];
  if (!allowed.includes(value.event_type)) {
    return {
      valid: false,
      error: `'${value.event_type}' is not valid for channel '${value.channel}'. Allowed: ${allowed.join(', ')}`,
    };
  }

  return { valid: true, value };
}

module.exports = { validateEvent };
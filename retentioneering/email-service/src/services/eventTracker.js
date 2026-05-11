// email-service/src/services/eventTracker.js

const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

const db = getFirestore();

const EVENT_FIELD_MAP = {
  email_sent:         'sent',
  email_delivered:    'delivered',
  email_opened:       'opened',
  link_clicked:       'clicked',
  bounced:            'bounced',
  unsubscribed:       'unsubscribed',
  spam_reported:      'spam',
  sms_sent:           'sent',
  sms_delivered:      'delivered',
  whatsapp_sent:      'sent',
  whatsapp_delivered: 'delivered',
  whatsapp_read:      'opened',
  push_sent:          'sent',
  push_delivered:     'delivered',
  push_clicked:       'clicked',
  push_dismissed:     'dismissed',
};

async function trackEvent({ org_id, user_id, event_type, channel, campaign_id, ab_variant, metadata }) {
  const event_id  = uuidv4();
  const timestamp = Timestamp.now();

  const orgRef   = db.collection('organizations').doc(org_id);
  const eventRef = orgRef.collection('events').doc(event_id);
  const cacheRef = orgRef.collection('analytics_cache').doc(campaign_id);

  const batch = db.batch();

  // Write raw event
  batch.set(eventRef, {
    user_id,
    event_type,
    channel,
    campaign_id,
    ab_variant:  ab_variant ?? null,
    timestamp,
    metadata:    metadata ?? {},
  });

  // Update analytics cache
  const cacheField = EVENT_FIELD_MAP[event_type];
  if (cacheField) {
    batch.set(cacheRef, {
      [cacheField]: FieldValue.increment(1),
      last_updated: timestamp,
      campaign_id,
      org_id,
    }, { merge: true });
  }

  await batch.commit();

  console.log(`[GETLOOPX] ✅ org:${org_id} | event:${event_type} | campaign:${campaign_id}`);
  return event_id;
}

module.exports = { trackEvent };
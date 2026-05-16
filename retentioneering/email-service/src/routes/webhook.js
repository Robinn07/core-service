// email-service/src/routes/webhook.js
// Getloopx Multi-Tenant Event Ingestion

const express          = require('express');
const router           = express.Router();
const { validateEvent} = require('../services/schemaValidator');
const { trackEvent }   = require('../services/eventTracker');

/**
 * POST /api/v1/event
 * Single event — called by SES/Twilio/Meta webhooks
 */
router.post('/event', async (req, res) => {
  const { valid, error, value } = validateEvent(req.body);

  if (!valid) {
    return res.status(422).json({ success: false, error });
  }

  try {
    const event_id = await trackEvent(value);
    return res.status(200).json({ success: true, event_id });
  } catch (err) {
    console.error(`[TRACK ERROR] ${err.message}`);
    return res.status(500).json({ success: false, error: 'Event tracking failed' });
  }
});

/**
 * POST /api/v1/event/batch
 * High-volume: up to 100 events per request
 */
router.post('/event/batch', async (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(422).json({ success: false, error: '`events` must be a non-empty array' });
  }

  if (events.length > 100) {
    return res.status(422).json({ success: false, error: 'Max 100 events per batch' });
  }

  const results = await Promise.allSettled(
    events.map(async (ev) => {
      const { valid, error, value } = validateEvent(ev);
      if (!valid) throw new Error(error);
      return trackEvent(value);
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;

  return res.status(200).json({
    success: true,
    summary: { total: events.length, succeeded, failed },
  });
});

module.exports = router;
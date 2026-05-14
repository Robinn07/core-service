const { Subscriber, List } = require('../models');

exports.getPreferences = async (req, res) => {
  const { id } = req.params; // Subscriber ID

  try {
    const subscriber = await Subscriber.findByPk(id, {
      include: [{ model: List, through: { attributes: [] } }]
    });

    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    res.json({
      email: subscriber.email,
      firstName: subscriber.firstName,
      status: subscriber.status,
      preferences: subscriber.preferences,
      lists: subscriber.Lists.map(l => ({ id: l.id, name: l.name }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  const { id } = req.params;
  const { status, preferences, unsubscribedListIds } = req.body;

  try {
    const subscriber = await Subscriber.findByPk(id);
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    const updates = {};

    // 1. Handle Global Unsubscribe/Status Change
    if (status) {
      updates.status = status;
    }

    // 2. Handle Granular Preferences
    if (preferences) {
      updates.preferences = { ...subscriber.preferences, ...preferences };
    }

    if (Object.keys(updates).length > 0) {
      await subscriber.update(updates);
    }

    // 3. Handle Per-List Unsubscribe
    if (unsubscribedListIds && unsubscribedListIds.length > 0) {
      await subscriber.removeLists(unsubscribedListIds);
    }

    res.json({ message: 'Your preferences have been updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

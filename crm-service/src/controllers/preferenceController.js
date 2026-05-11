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
      lists: subscriber.Lists.map(l => ({ id: l.id, name: l.name }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  const { id } = req.params;
  const { status, unsubscribedListIds } = req.body;

  try {
    const subscriber = await Subscriber.findByPk(id);
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    // 1. Handle Global Unsubscribe
    if (status === 'unsubscribed') {
      await subscriber.update({ status: 'unsubscribed' });
      return res.json({ message: 'You have been unsubscribed from all emails.' });
    }

    // 2. Handle Per-List Unsubscribe
    if (unsubscribedListIds && unsubscribedListIds.length > 0) {
      await subscriber.removeLists(unsubscribedListIds);
    }

    res.json({ message: 'Your preferences have been updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { List, Subscriber } = require('../models');

exports.createList = async (req, res) => {
  try {
    const { name, description } = req.body;
    const orgId = req.user?.orgId || 'crm-system';
    const list = await List.create({ name, description, orgId });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllLists = async (req, res) => {
  try {
    const orgId = req.user?.orgId || 'crm-system';
    const lists = await List.findAll({
      where: { orgId },
      include: [{
        model: Subscriber,
        through: { attributes: [] },
        attributes: ['id']
      }]
    });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getListById = async (req, res) => {
  try {
    const orgId = req.user?.orgId || 'crm-system';
    const list = await List.findOne({
      where: { id: req.params.id, orgId },
      include: [{ model: Subscriber, through: { attributes: [] } }]
    });
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteList = async (req, res) => {
  try {
    const orgId = req.user?.orgId || 'crm-system';
    const list = await List.findOne({ where: { id: req.params.id, orgId } });
    if (!list) return res.status(404).json({ error: 'List not found' });
    await list.destroy();
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

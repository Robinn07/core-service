const { List, Subscriber } = require('../models');

exports.createList = async (req, res) => {
  try {
    const { name, description } = req.body;
    const list = await List.create({ name, description });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllLists = async (req, res) => {
  try {
    const lists = await List.findAll({
      include: [{
        model: Subscriber,
        through: { attributes: [] },
        attributes: ['id'] // Just count or brief info
      }]
    });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getListById = async (req, res) => {
  try {
    const list = await List.findByPk(req.params.id, {
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
    const list = await List.findByPk(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    await list.destroy();
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { Subscriber, List, Tag, EventLog, ConsentLog } = require('../models');
const { Op } = require('sequelize');
const crmService = require('../services/crmService');
const appEmitter = require('../utils/events');

/**
 * @swagger
 * components:
 *   schemas:
// ...
 const doiService = require('../services/doiService');

 /**
  * @swagger
 // ...
  */

 exports.createSubscriber = async (req, res) => {
   try {
     const { email, firstName, lastName, attributes, listIds, tagIds } = req.body;
     const orgId = req.user.orgId;
     const ipAddress = req.ip || req.headers['x-forwarded-for'];
     const userAgent = req.headers['user-agent'];

     let subscriber = await Subscriber.findOne({ where: { email, orgId } });
     if (subscriber) return res.status(400).json({ error: 'Subscriber already exists in this organization' });

     subscriber = await Subscriber.create({ 
       email, 
       firstName, 
       lastName, 
       attributes, 
       orgId,
       status: 'pending' // Force pending until DOI confirmation
     });

     // Log Consent
     await ConsentLog.create({
       subscriberId: subscriber.id,
       orgId,
       source: req.user.role === 'admin' ? 'Dashboard/Admin' : 'API',
       ipAddress,
       userAgent,
       consentType: 'SUBSCRIBE'
     });

     if (listIds && listIds.length > 0) await subscriber.addLists(listIds);
     if (tagIds && tagIds.length > 0) await subscriber.addTags(tagIds);

     // Trigger Double Opt-In Email
     await doiService.sendConfirmationEmail(subscriber);

     appEmitter.emit('subscriber_created', subscriber);

     res.status(201).json({
       message: 'Subscriber created. Confirmation email sent.',
       subscriberId: subscriber.id
     });
   } catch (error) { res.status(500).json({ error: error.message }); }
 };

exports.exportData = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;

    const subscriber = await Subscriber.findOne({
      where: { id, orgId },
      include: [
        { model: List, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } },
        { model: ConsentLog, as: 'consentLogs' },
        { model: EventLog, limit: 100, order: [['createdAt', 'DESC']] }
      ]
    });

    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    const exportBundle = {
      profile: {
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        status: subscriber.status,
        createdAt: subscriber.createdAt,
        attributes: subscriber.attributes
      },
      intelligence: {
        churnScore: subscriber.churnScore,
        leadScore: subscriber.leadScore,
        leadTemperature: subscriber.leadTemperature,
        preferredSendHour: subscriber.preferredSendHour
      },
      memberships: {
        lists: subscriber.Lists.map(l => l.name),
        tags: subscriber.Tags.map(t => t.name)
      },
      auditTrail: subscriber.consentLogs.map(log => ({
        source: log.source,
        ip: log.ipAddress,
        userAgent: log.userAgent,
        timestamp: log.createdAt
      })),
      activity: subscriber.EventLogs.map(log => ({
        event: log.type,
        timestamp: log.createdAt,
        campaignId: log.campaignId,
        metadata: {
          url: log.url,
          country: log.country,
          device: log.deviceType
        }
      }))
    };

    res.json(exportBundle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.findAll({
      where: { orgId: req.user.orgId },
      include: [
        { model: List, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } }
      ]
    });
    res.json(subscribers);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getSubscriberById = async (req, res) => {
  try {
    const subscriber = await Subscriber.findOne({ 
      where: { id: req.params.id, orgId: req.user.orgId },
      include: [
        { model: List, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } }
      ]
    });
    if (!subscriber) return res.status(404).json({ error: 'Not found' });
    res.json(subscriber);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateSubscriber = async (req, res) => {
  try {
    const { firstName, lastName, attributes, status, listIds, tagIds } = req.body;
    const subscriber = await Subscriber.findOne({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!subscriber) return res.status(404).json({ error: 'Not found' });
    
    await subscriber.update({ firstName, lastName, attributes, status });
    if (listIds) await subscriber.setLists(listIds);
    if (tagIds) await subscriber.setTags(tagIds);
    res.json(subscriber);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Subscriber.findOne({ where: { id: req.params.id, orgId: req.user.orgId } });
    if (!subscriber) return res.status(404).json({ error: 'Not found' });
    await subscriber.destroy();
    res.json({ message: 'Subscriber deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { listId } = req.body;
    const results = await crmService.importSubscribersFromCSV(req.file.path, listId, req.user.orgId);
    
    res.json({
      message: 'Import completed',
      ...results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/subscribers/segment:
 *   post:
 *     summary: Filter subscribers based on tags, attributes, and activity
 *     tags: [Subscribers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               attributes:
 *                 type: object
 *               status:
 *                 type: string
 *               activity:
 *                 type: object
 *                 properties:
 *                   lastActiveDays:
 *                     type: integer
 *     responses:
 *       200:
 *         description: List of filtered subscribers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscriber'
 */
exports.segmentSubscribers = async (req, res) => {
  try {
    const { tags, attributes, status, activity } = req.body;
    const orgId = req.user.orgId;

    const queryOptions = {
      where: { orgId },
      include: [
        { model: List, through: { attributes: [] } },
        { model: Tag, through: { attributes: [] } }
      ]
    };

    if (status) queryOptions.where.status = status;

    if (tags && tags.length > 0) {
      queryOptions.include.push({
        model: Tag,
        where: { name: { [Op.in]: tags } },
        through: { attributes: [] }
      });
    }

    if (attributes) {
      Object.keys(attributes).forEach(key => {
        queryOptions.where[`attributes.${key}`] = attributes[key];
      });
    }

    // Advanced Activity Filtering (Intelligence Layer)
    if (activity) {
      const { minOpens, minClicks, lastActiveDays } = activity;
      
      const eventInclude = {
        model: EventLog,
        required: false,
        where: { orgId }
      };

      if (lastActiveDays) {
        const date = new Date();
        date.setDate(date.getDate() - lastActiveDays);
        eventInclude.where.createdAt = { [Op.gte]: date };
        eventInclude.required = true; // Only those with recent activity
      }

      // Note: For complex aggregations like minOpens, 
      // we usually use subqueries or a specific analytics table.
      // For this PoC, we'll filter post-fetch or use a simplified approach.
    }

    const subscribers = await Subscriber.findAll(queryOptions);
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.mergeSubscribers = async (req, res) => {
  const { sourceId, targetId } = req.body;
  const orgId = req.user.orgId;
  const { sequelize } = require('../models');

  const transaction = await sequelize.transaction();

  try {
    const source = await Subscriber.findOne({ where: { id: sourceId, orgId }, transaction });
    const target = await Subscriber.findOne({ where: { id: targetId, orgId }, transaction });

    if (!source || !target) {
      return res.status(404).json({ error: 'Source or Target subscriber not found' });
    }

    // 1. Move Memberships (Tags, Lists)
    const sourceTags = await source.getTags({ transaction });
    const sourceLists = await source.getLists({ transaction });

    await target.addTags(sourceTags, { transaction });
    await target.addLists(sourceLists, { transaction });

    // 2. Merge Attributes (Target wins in conflicts)
    const mergedAttributes = { ...source.attributes, ...target.attributes };
    
    // 3. Update Target stats (Aggregate)
    const totalOpens = (source.totalOpens || 0) + (target.totalOpens || 0);
    const totalClicks = (source.totalClicks || 0) + (target.totalClicks || 0);

    await target.update({
      attributes: mergedAttributes,
      totalOpens,
      totalClicks,
      lastActivity: source.lastActivity > target.lastActivity ? source.lastActivity : target.lastActivity
    }, { transaction });

    // 4. Redirect Event Logs and Campaign Logs
    await EventLog.update({ subscriberId: targetId }, { where: { subscriberId: sourceId, orgId }, transaction });
    await CampaignLog.update({ subscriberId: targetId }, { where: { subscriberId: sourceId, orgId }, transaction });

    // 5. Delete Source
    await source.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'Subscribers merged successfully', targetId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

exports.convertSegmentToStatic = async (req, res) => {
  const { segmentCriteria, listName } = req.body;
  const orgId = req.user.orgId;

  try {
    // 1. Fetch subscribers matching criteria (reuse segmentSubscribers logic internally)
    // For simplicity, we'll use the existing segmentSubscribers logic via direct call or refactoring.
    // Here we'll implement a condensed version.
    const queryOptions = {
      where: { orgId, ...segmentCriteria.where },
      include: segmentCriteria.include || []
    };

    const subscribers = await Subscriber.findAll(queryOptions);

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found for this segment' });
    }

    // 2. Create new static list
    const list = await List.create({
      orgId,
      name: listName || `Snapshot: ${new Date().toISOString()}`,
      description: 'Static snapshot of a dynamic segment'
    });

    // 3. Add subscribers to list
    await list.addSubscribers(subscribers);

    res.status(201).json({
      message: 'Static list created from segment',
      listId: list.id,
      count: subscribers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

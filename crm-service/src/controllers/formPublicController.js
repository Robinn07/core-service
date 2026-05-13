const { Form, Subscriber, List, ConsentLog } = require('../models');
const doiService = require('../services/doiService');
const webhookService = require('../services/webhookService');

exports.submitForm = async (req, res) => {
  const { formId } = req.params;
  const formData = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  try {
    const form = await Form.findByPk(formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    if (!formData.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 1. Create or Update Subscriber
    const [subscriber, created] = await Subscriber.findOrCreate({
      where: { email: formData.email, orgId: form.orgId },
      defaults: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        attributes: formData.attributes || {},
        status: 'pending'
      }
    });

    if (!created) {
        // Update existing subscriber data
        await subscriber.update({
            firstName: formData.firstName || subscriber.firstName,
            lastName: formData.lastName || subscriber.lastName,
            attributes: { ...subscriber.attributes, ...(formData.attributes || {}) }
        });
    }

    // 2. Log Consent Audit Trail
    await ConsentLog.create({
      subscriberId: subscriber.id,
      orgId: form.orgId,
      source: `Form: ${form.name} (ID: ${form.id})`,
      ipAddress,
      userAgent,
      consentType: 'SUBSCRIBE'
    });

    // 3. Add to the linked List
    const list = await List.findByPk(form.listId);
    if (list) {
      await subscriber.addList(list);
    }

    // 3. Trigger Double Opt-In
    // We send DOI even for existing users if they aren't active, 
    // or if we want to re-verify for this specific form join.
    if (subscriber.status !== 'active') {
        await doiService.sendConfirmationEmail(subscriber);
    }

    // 4. Trigger Webhook
    webhookService.dispatch(form.orgId, 'form.submitted', {
      formId: form.id,
      subscriberId: subscriber.id,
      email: subscriber.email
    });

    res.status(200).json({ message: form.successMessage });
  } catch (error) {
    console.error('Form Submission Error:', error);
    res.status(500).json({ error: 'Failed to process form submission' });
  }
};

exports.renderLandingPage = async (req, res) => {
  const { slug } = req.params;

  try {
    const form = await Form.findOne({ 
        where: { slug, isLandingPage: true, isActive: true } 
    });

    if (!form || !form.htmlContent) {
      return res.status(404).send('Landing page not found');
    }

    res.send(form.htmlContent);
  } catch (error) {
    console.error('Render Landing Page Error:', error);
    res.status(500).send('Failed to load landing page');
  }
};

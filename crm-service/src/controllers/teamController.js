const { UserRole } = require('../models');
const emailQueue = require('../queue/emailQueue');

exports.getTeamMembers = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const members = await UserRole.findAll({ where: { orgId } });
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { orgId } = req.user;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Queue the invitation email
    await emailQueue.add('send-invitation', {
        to: email,
        orgId: orgId,
        subject: 'You have been invited to join GetLoopX!',
        template: 'invitation', // Assuming you have an 'invitation' template
        context: {
            orgId: orgId,
            inviteLink: `${process.env.DASHBOARD_URL}/register?orgId=${orgId}`
        }
    });
    
    res.status(201).json({ message: "Invitation sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send invite: " + error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;
    
    await UserRole.destroy({ where: { id, orgId } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

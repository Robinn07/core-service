const { UserRole } = require('../models');

exports.getTeamMembers = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const members = await UserRole.findAll({ where: { orgId } });
    
    // We might not have email stored in UserRole, just uid.
    // If you sync email, you'd join with a User table, but GetLoopX seems to rely on Firebase Auth.
    // For now, we will return the user roles.
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  // Mock invite logic for now
  res.status(201).json({ message: "Invitation sent" });
};

exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;
    
    // Cannot remove self or primary admin logic should be here
    await UserRole.destroy({ where: { id, orgId } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

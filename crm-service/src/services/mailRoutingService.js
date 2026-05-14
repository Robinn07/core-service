const { Domain } = require('../models');

class MailRoutingService {
  /**
   * Resolves the best sender identity for an organization and email type.
   * @param {string} orgId - The organization ID.
   * @param {string} type - 'MARKETING' or 'TRANSACTIONAL'.
   * @returns {Promise<{ fromEmail: string, configurationSet: string|null }>}
   */
  async getSenderIdentity(orgId, type = 'MARKETING') {
    // 1. Check for verified custom domains for this Org
    const customDomain = await Domain.findOne({
      where: {
        orgId,
        verificationStatus: 'verified'
      },
      order: [['isDefault', 'DESC']] // Priority to default verified domain
    });

    if (customDomain) {
      // Use the custom domain. We assume 'hello' as a generic prefix if not specified
      // In a more advanced setup, this could be configurable per org.
      return {
        fromEmail: `hello@${customDomain.domainName}`,
        configurationSet: null // Placeholder for Level 3
      };
    }

    // 2. Fallback to Shared Infrastructure (Level 1)
    const sharedMarketingDomain = process.env.SHARED_MARKETING_DOMAIN || 'mail.getloopx.com';
    const sharedTransactionalDomain = process.env.SHARED_TX_DOMAIN || 'tx.getloopx.com';
    const parentDomain = process.env.PARENT_DOMAIN || 'getloopx.com';

    let domain = parentDomain;
    if (type === 'MARKETING') {
      domain = sharedMarketingDomain;
    } else if (type === 'TRANSACTIONAL') {
      domain = sharedTransactionalDomain;
    }

    // For shared domains, we use the orgId as a sub-address or prefix to maintain some isolation
    // e.g., org123@mail.getloopx.com
    return {
      fromEmail: `info@${domain}`,
      configurationSet: null
    };
  }
}

module.exports = new MailRoutingService();

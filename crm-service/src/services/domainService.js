const { VerifyDomainDkimCommand, VerifyDomainIdentityCommand, GetIdentityVerificationAttributesCommand } = require("@aws-sdk/client-ses");
const sesClient = require('../config/ses');
const { Domain } = require('../models');

class DomainService {
  async registerDomain(orgId, domainName) {
    // 1. Register with SES
    const verifyIdentityCommand = new VerifyDomainIdentityCommand({ Domain: domainName });
    await sesClient.send(verifyIdentityCommand);

    // 2. Get DKIM Tokens
    const verifyDkimCommand = new VerifyDomainDkimCommand({ Domain: domainName });
    const dkimResponse = await sesClient.send(verifyDkimCommand);
    const dkimTokens = dkimResponse.DkimTokens;

    // 3. Generate SPF and DMARC suggested records
    const spfRecord = "v=spf1 include:amazonses.com ~all";
    const dmarcRecord = `v=DMARC1; p=none; rua=mailto:dmarc-reports@${domainName}`;

    // 4. Save to Database
    const domain = await Domain.create({
      orgId,
      domainName,
      dkimTokens,
      spfRecord,
      dmarcRecord,
      verificationStatus: 'pending'
    });

    return domain;
  }

  async checkVerificationStatus(domainId) {
    const domain = await Domain.findByPk(domainId);
    if (!domain) throw new Error('Domain not found');

    const command = new GetIdentityVerificationAttributesCommand({
      Identities: [domain.domainName]
    });

    const response = await sesClient.send(command);
    const attrs = response.VerificationAttributes[domain.domainName];

    if (attrs && attrs.VerificationStatus === 'Success') {
      await domain.update({ verificationStatus: 'verified' });
    }

    return domain;
  }

  async getDnsRecords(domainId) {
    const domain = await Domain.findByPk(domainId);
    if (!domain) throw new Error('Domain not found');

    return {
      dkim: domain.dkimTokens.map(token => ({
        type: 'CNAME',
        name: `${token}._domainkey.${domain.domainName}`,
        value: `${token}.dkim.amazonses.com`
      })),
      spf: {
        type: 'TXT',
        name: domain.domainName,
        value: domain.spfRecord
      },
      dmarc: {
        type: 'TXT',
        name: `_dmarc.${domain.domainName}`,
        value: domain.dmarcRecord
      }
    };
  }
}

module.exports = new DomainService();

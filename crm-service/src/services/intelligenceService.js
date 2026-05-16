const logger = require('../utils/logger');

/**
 * Intelligence Service
 * Handles Pre-flight checks: Subject Line Scoring and Spam Analysis.
 */
class IntelligenceService {
  /**
   * Score a subject line based on known best practices and historical data.
   * @param {string} subject 
   * @param {string} orgId 
   */
  async scoreSubjectLine(subject, orgId) {
    if (!subject) return { score: 0, feedback: ['Subject line is missing.'] };

    let score = 70; // Base score
    const feedback = [];

    // 1. Length Check (Ideal: 30-50 chars)
    if (subject.length < 20) {
      score -= 10;
      feedback.push('Subject is a bit short. Try adding more context.');
    } else if (subject.length > 60) {
      score -= 15;
      feedback.push('Subject is too long and may be truncated on mobile devices.');
    } else {
      score += 10;
      feedback.push('Great length! Ideal for both desktop and mobile.');
    }

    // 2. Personalization Check
    if (subject.includes('{{')) {
      score += 15;
      feedback.push('Personalization detected. This usually increases open rates by 20%.');
    } else {
      feedback.push('Consider adding personalization (e.g., {{firstName}}) to grab attention.');
    }

    // 3. Emoji Check
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(subject)) {
      score += 5;
      feedback.push('Nice use of emojis! They help your email stand out in a crowded inbox.');
    }

    // 4. Spam Trigger Words Check
    const spamWords = ['free', 'guaranteed', 'win', 'cash', 'money', 'urgent', 'act now', 'click here'];
    const lowerSubject = subject.toLowerCase();
    const detectedSpamWords = spamWords.filter(word => lowerSubject.includes(word));
    
    if (detectedSpamWords.length > 0) {
      score -= (detectedSpamWords.length * 10);
      feedback.push(`Detected potential spam words: ${detectedSpamWords.join(', ')}. Use these sparingly.`);
    }

    // 5. Case Check
    if (subject === subject.toUpperCase() && subject.length > 10) {
      score -= 20;
      feedback.push('Avoid using ALL CAPS. It can trigger spam filters and feels like shouting.');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback,
      sentiment: this._analyzeSentiment(subject)
    };
  }

  /**
   * Analyze email content for spam risk factors.
   * @param {object} content { subject, htmlBody }
   */
  async analyzeSpamRisk(content) {
    const { subject, htmlBody } = content;
    let riskScore = 0; // 0 = Clean, 100 = Definitive Spam
    const issues = [];

    // 1. Image-to-Text Ratio
    const textLength = htmlBody.replace(/<[^>]*>/g, '').length;
    const imageCount = (htmlBody.match(/<img/g) || []).length;
    
    if (imageCount > 3 && textLength < 500) {
      riskScore += 20;
      issues.push({ severity: 'MEDIUM', message: 'High image-to-text ratio. Add more text to balance your layout.' });
    }

    // 2. Broken Links / Excessive Links
    const linkCount = (htmlBody.match(/<a/g) || []).length;
    if (linkCount > 15) {
      riskScore += 15;
      issues.push({ severity: 'LOW', message: 'High number of links detected. This can sometimes flag spam filters.' });
    }

    // 3. Missing Unsubscribe Link (Compliance)
    if (!htmlBody.toLowerCase().includes('unsubscribe')) {
      riskScore += 40;
      issues.push({ severity: 'HIGH', message: 'Unsubscribe link not found. This is a major compliance risk.' });
    }

    // 4. Suspicious Attributes
    if (htmlBody.includes('display:none') || htmlBody.includes('font-size:0')) {
      riskScore += 30;
      issues.push({ severity: 'HIGH', message: 'Hidden text detected. Spammers often use this to trick filters.' });
    }

    return {
      riskLevel: riskScore > 50 ? 'HIGH' : (riskScore > 20 ? 'MEDIUM' : 'LOW'),
      riskScore,
      issues
    };
  }

  _analyzeSentiment(text) {
    const positiveWords = ['great', 'awesome', 'happy', 'excited', 'exclusive', 'offer', 'congratulations'];
    const negativeWords = ['bad', 'sad', 'wrong', 'stop', 'cancel', 'expired', 'warning'];
    
    const lower = text.toLowerCase();
    let posCount = positiveWords.filter(w => lower.includes(w)).length;
    let negCount = negativeWords.filter(w => lower.includes(w)).length;

    if (posCount > negCount) return 'POSITIVE';
    if (negCount > posCount) return 'URGENT/NEGATIVE';
    return 'NEUTRAL';
  }
}

module.exports = new IntelligenceService();

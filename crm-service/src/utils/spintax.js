/**
 * Spintax Utility
 * Handles text randomization in the format: {option1|option2|option3}
 */
class Spintax {
  /**
   * Process a string and replace spintax patterns with a random choice.
   * @param {string} text 
   * @returns {string}
   */
  process(text) {
    if (!text || typeof text !== 'string') return text;

    const spintaxRegex = /\{([^{}]+)\}/g;
    let result = text;

    while (spintaxRegex.test(result)) {
      result = result.replace(spintaxRegex, (match, options) => {
        const choices = options.split('|');
        return choices[Math.floor(Math.random() * choices.length)];
      });
    }

    return result;
  }
}

module.exports = new Spintax();

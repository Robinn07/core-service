const { Op } = require('sequelize');

class DynamicSegmentService {
  /**
   * Translates a JSON segment configuration into a Sequelize WHERE object.
   * @param {Object} config - The segment configuration.
   * @returns {Object} - The Sequelize WHERE object.
   */
  buildWhereClause(config) {
    if (!config || !config.conditions || config.conditions.length === 0) {
      return {};
    }

    return this._parseGroup(config);
  }

  /**
   * Internal recursive parser for groups (AND/OR).
   */
  _parseGroup(group) {
    const logic = group.logic === 'OR' ? Op.or : Op.and;
    const conditions = group.conditions.map(cond => {
      if (cond.logic) {
        // Nested group
        return this._parseGroup(cond);
      } else {
        // Individual condition
        return this._parseCondition(cond);
      }
    });

    return { [logic]: conditions };
  }

  /**
   * Internal parser for individual conditions.
   */
  _parseCondition(cond) {
    const { field, operator, value } = cond;
    let sequelizeOp;

    switch (operator) {
      case 'eq': sequelizeOp = Op.eq; break;
      case 'ne': sequelizeOp = Op.ne; break;
      case 'gt': sequelizeOp = Op.gt; break;
      case 'gte': sequelizeOp = Op.gte; break;
      case 'lt': sequelizeOp = Op.lt; break;
      case 'lte': sequelizeOp = Op.lte; break;
      case 'contains': sequelizeOp = Op.like; break; // Note: value should include %
      case 'in': sequelizeOp = Op.in; break;
      case 'nin': sequelizeOp = Op.notIn; break;
      default: sequelizeOp = Op.eq;
    }

    // Handle attributes (JSONB)
    if (field.startsWith('attr.')) {
      const attrKey = field.split('.')[1];
      return {
        attributes: {
          [attrKey]: { [sequelizeOp]: value }
        }
      };
    }

    return { [field]: { [sequelizeOp]: value } };
  }
}

module.exports = new DynamicSegmentService();

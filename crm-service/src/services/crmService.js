const fs = require('fs');
const csv = require('csv-parser');
const { Subscriber, List } = require('../models');
const { sequelize } = require('../config/db');

exports.importSubscribersFromCSV = async (filePath, listId = null) => {
  const subscribers = [];
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Basic mapping: CSV headers should match these or we map them
        // Expected headers: email, firstName, lastName, [any other columns become attributes]
        const { email, firstName, lastName, ...otherAttributes } = data;
        
        if (email) {
          subscribers.push({
            email,
            firstName,
            lastName,
            attributes: otherAttributes
          });
        }
      })
      .on('end', async () => {
        const transaction = await sequelize.transaction();
        try {
          for (const subData of subscribers) {
            try {
              const [subscriber, created] = await Subscriber.findOrCreate({
                where: { email: subData.email },
                defaults: subData,
                transaction
              });

              if (!created) {
                await subscriber.update(subData, { transaction });
              }

              if (listId) {
                await subscriber.addList(listId, { transaction });
              }
              results.success++;
            } catch (err) {
              results.failed++;
              results.errors.push({ email: subData.email, error: err.message });
            }
          }
          await transaction.commit();
          resolve(results);
        } catch (error) {
          await transaction.rollback();
          reject(error);
        } finally {
          // Cleanup file
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(err);
      });
  });
};

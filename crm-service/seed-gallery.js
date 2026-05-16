require('dotenv').config();
const { Template } = require('./src/models');
const { sequelize } = require('./src/config/db');

const categories = [
  'E-commerce', 'Newsletter', 'Welcome', 'Holiday', 
  'Promotional', 'Event', 'Education', 'Real Estate', 
  'B2B', 'Transactional'
];

async function seedGallery() {
  try {
    await sequelize.authenticate();
    console.log('Database connected for gallery seeding...');

    // Clear existing gallery templates to prevent duplicates on rerun
    await Template.destroy({ where: { isGallery: true } });

    const galleryTemplates = [];
    
    // Generate 100 templates
    for (let i = 1; i <= 100; i++) {
      const category = categories[i % categories.length];
      galleryTemplates.push({
        name: `${category} Template Pro v${i}`,
        subject: `Your amazing ${category} template inside!`,
        orgId: 'SYSTEM',
        htmlContent: `<html><body style="font-family: sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
          <div style="background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #333;">Premium ${category} Template</h1>
            <p style="color: #666; line-height: 1.6;">This is beautifully crafted pre-designed layout #${i} tailored specifically for the ${category} sector. Engage your audience effectively.</p>
            <div style="margin-top: 30px;">
              <a href="https://example.com" style="background: #0052cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Discover More</a>
            </div>
          </div>
        </body></html>`,
        category: category,
        isGallery: true,
        isPublic: true,
        thumbnail: `https://via.placeholder.com/300x400?text=${category}+${i}`
      });
    }

    await Template.bulkCreate(galleryTemplates);
    console.log('Successfully seeded 100+ pre-designed Gallery Templates.');
    process.exit(0);
  } catch (error) {
    console.error('Gallery seeding failed:', error);
    process.exit(1);
  }
}

seedGallery();

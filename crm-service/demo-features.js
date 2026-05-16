const { Template, Form, List } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function demo() {
  const ORG_ID = 'ORG_123';

  try {
    // 1. Create an AMP-enabled Template
    const ampTemplate = await Template.create({
      name: 'AMP Welcome Email',
      orgId: ORG_ID,
      subject: 'Welcome to GetLoopX!',
      htmlContent: '<h1>Welcome!</h1><p>Check out our products.</p>',
      ampHtmlContent: `
<!doctype html>
<html ⚡4email>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <style amp4email-boilerplate>body{visibility:hidden}</style>
</head>
<body>
  <h1>Interactive Welcome!</h1>
  <p>This is an AMP email with dynamic content capabilities.</p>
  <amp-img src="https://via.placeholder.com/600x200" width="600" height="200" layout="responsive"></amp-img>
</body>
</html>
      `.trim()
    });
    console.log('✅ Created AMP Template:', ampTemplate.name);

    // 2. Create a Landing Page Form
    // First we need a list for the signups
    const [list] = await List.findOrCreate({ 
      where: { name: 'Landing Page Signups', orgId: ORG_ID },
      defaults: { orgId: ORG_ID }
    });

    const landingPage = await Form.create({
      name: 'Black Friday Special',
      orgId: ORG_ID,
      listId: list.id,
      isLandingPage: true,
      slug: 'black-friday',
      htmlContent: `
<!DOCTYPE html>
<html>
  <head>
    <title>Black Friday Sale</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a1a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
      .container { background: #333; padding: 3rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; max-width: 400px; }
      h1 { color: #ff4757; font-size: 2.5rem; margin-bottom: 0.5rem; }
      p { color: #ccc; margin-bottom: 2rem; }
      input { display: block; width: 100%; padding: 12px; margin-bottom: 1rem; border-radius: 6px; border: none; background: #444; color: white; box-sizing: border-box; }
      button { background: #ff4757; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.3s; }
      button:hover { background: #ff6b81; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>BLACK FRIDAY</h1>
      <p>Enter your email to get early access to 50% OFF!</p>
      <form action="/api/public/forms/${list.id}/submit" method="POST">
        <input type="email" name="email" placeholder="you@example.com" required />
        <button type="submit">GET EARLY ACCESS</button>
      </form>
    </div>
  </body>
</html>
      `.trim()
    });
    console.log('✅ Created Landing Page:', landingPage.name);
    console.log(`\nView your Landing Page at: http://localhost:4000/api/public/p/${landingPage.slug}`);

  } catch (err) {
    console.error('Error creating demo data:', err.message);
  } finally {
    await sequelize.close();
  }
}

demo();

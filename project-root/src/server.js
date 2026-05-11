const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ GetLoopx Production Server running on port ${PORT}`);
});
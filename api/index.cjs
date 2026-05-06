/**
 * api/index.cjs
 * CommonJS Bridge for Vercel to load the ESM backend server.
 */
module.exports = async (req, res) => {
  // Use dynamic import to load the ESM module
  const { default: app } = await import('../backend/server.js');
  
  // Forward the request to the express app
  return app(req, res);
};

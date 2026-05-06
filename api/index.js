/**
 * api/index.js
 * CommonJS Bridge for Vercel serverless — loads ESM backend server.
 */

let appPromise = null;

function getApp() {
  if (!appPromise) {
    appPromise = import('../backend/server.js')
      .then(async (mod) => {
        const { connectDB } = await import('../backend/db/mongo.js');
        await connectDB();
        return mod.default;
      })
      .catch((err) => {
        // Reset so next cold start retries
        appPromise = null;
        throw err;
      });
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Failed to initialize server:', err.message);
    res.status(503).json({ error: 'Service unavailable', detail: err.message });
  }
};

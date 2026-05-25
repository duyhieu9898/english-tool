import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  collection: 'systemLogs',
  // Capped Collection in MongoDB is a circular buffer of a fixed size.
  // Once it fills, it makes room for new documents by overwriting the oldest.
  // This completely eliminates database bloat and manual log purging.
  capped: { size: 5 * 1024 * 1024, max: 2000 } // 5MB limit, max 2000 documents
});

export const SystemLog = mongoose.models.SystemLog || mongoose.model('SystemLog', SystemLogSchema);

import mongoose from 'mongoose';

const LessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true },
    type: {
      type: String,
      enum: ['vocabulary', 'grammar', 'reading', 'listening'],
      required: true,
    },
    level: { type: String, required: true },
    title: String,
    name: String,
    lastUpdated: { type: String, default: () => new Date().toISOString() },
  },
  { collection: 'lessons', strict: false },
);

// Create index for fast searching
LessonSchema.index({ type: 1, level: 1 });
LessonSchema.index({ slug: 1 });

export const Lesson = mongoose.model('Lesson', LessonSchema);

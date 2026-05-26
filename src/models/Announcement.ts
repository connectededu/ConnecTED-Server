
import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  authorId: string;
  authorRole: string;
  targetAudience: 'all' | 'parents' | 'teachers' | 'class';
  targetClassIds?: string[];
  targetStudentIds?: string[];
  attachments: any[];
  publishedAt: Date;
  image?: string;
}

const AnnouncementSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: String, required: true },
    authorRole: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ['all', 'parents', 'teachers', 'class'],
      required: true,
    },
    targetClassIds: { type: [String], default: [] },
    targetStudentIds: { type: [String], default: [] },
    attachments: [{ type: Schema.Types.Mixed }],
    publishedAt: { type: Date, default: Date.now },
    image: { type: String },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ targetAudience: 1 });
AnnouncementSchema.index({ targetClassIds: 1 });
AnnouncementSchema.index({ targetStudentIds: 1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);


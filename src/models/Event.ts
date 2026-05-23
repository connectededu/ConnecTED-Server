
import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  createdBy: string;
  rsvps: { userId: string; status: 'attending' | 'not_attending' }[];
  targetAudience: 'all' | 'parents' | 'teachers' | 'class';
  targetClassIds?: string[];
  status?: 'active' | 'archived';
}

const EventSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String },
    createdBy: { type: String, required: true },
    rsvps: [
      {
        userId: { type: String, required: true },
        status: { type: String, enum: ['attending', 'not_attending'], required: true },
      },
    ],
    targetAudience: {
      type: String,
      enum: ['all', 'parents', 'teachers', 'class'],
      required: true,
    },
    targetClassIds: [{ type: String }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);

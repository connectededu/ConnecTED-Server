
import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'message' | 'grade' | 'absent' | 'announcement' | 'event' | 'homework' | 'approval';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ['message', 'grade', 'absent', 'announcement', 'event', 'homework', 'approval'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);


import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  threadId: string;
  senderId: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: any[];
}

const MessageSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    threadId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    attachments: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

// Index for efficient thread message lookups
MessageSchema.index({ threadId: 1, timestamp: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

export interface IReadByEntry {
  userId: string;
  readAt: Date;
}

export interface IMessageThread extends Document {
  participants: { id: string; role: string }[];
  studentId: string;
  /** Fix B1: per-participant read tracking — list of users who have read the thread */
  readBy: IReadByEntry[];
  /** Approximate unread count for display (number of participants who haven't read yet) */
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
}

const MessageThreadSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    participants: [
      {
        id: { type: String, required: true },
        role: { type: String, required: true },
      },
    ],
    studentId: { type: String, required: true },
    /** Fix B1: per-participant read tracking */
    readBy: [
      {
        userId: { type: String, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    unreadCount: { type: Number, default: 0 },
    lastMessage: {
      content: { type: String },
      senderId: { type: String },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

// Index for fast participant lookups
MessageThreadSchema.index({ 'participants.id': 1 });
MessageThreadSchema.index({ studentId: 1 });

export const MessageThread = mongoose.model<IMessageThread>(
  'MessageThread',
  MessageThreadSchema
);


import mongoose, { Document, Schema } from 'mongoose';

export interface IHomework extends Document {
  classId: string;
  teacherId: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  attachments: any[]; // Define properly if needed
  createdAt: Date;
}

const HomeworkSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true },
    teacherId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: String, required: true },
    attachments: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

HomeworkSchema.index({ classId: 1 });
HomeworkSchema.index({ teacherId: 1 });

export default mongoose.model<IHomework>('Homework', HomeworkSchema);


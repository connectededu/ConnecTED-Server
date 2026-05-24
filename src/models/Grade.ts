
import mongoose, { Document, Schema } from 'mongoose';

export interface IGrade extends Document {
  studentId: string;
  classId: string;
  subject: string;
  term: string;
  score: number;
  maxScore: number;
  teacherId: string;
  publishedAt?: Date;
  comments?: string;
}

const GradeSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    classId: { type: String, required: true },
    subject: { type: String, required: true },
    term: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    teacherId: { type: String, required: true },
    publishedAt: { type: Date },
    comments: { type: String },
  },
  { timestamps: true }
);

GradeSchema.index({ studentId: 1 });
GradeSchema.index({ classId: 1 });
GradeSchema.index({ teacherId: 1 });

export default mongoose.model<IGrade>('Grade', GradeSchema);


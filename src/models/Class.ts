
import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  name: string;
  grade: string;
  section: string;
  teacherIds: string[];
  studentIds: string[];
  subjects: string[];
}

const ClassSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    grade: { type: String, required: true },
    section: { type: String, required: true },
    teacherIds: [{ type: String }],
    studentIds: [{ type: String }],
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IClass>('Class', ClassSchema);

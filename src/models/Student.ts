
import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  dateOfBirth: string;
  admissionNumber: string;
  classId: string; // Reference to Class
  programId?: string; // Reference to Program
  parentIds: string[]; // Reference to User (Parents)
  avatar?: string;
  previousSchool?: string;
}

const StudentSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    admissionNumber: { type: String, required: true, unique: true },
    classId: { type: String, required: true }, // Keeping as string for now to match mock data ID
    programId: { type: String },
    parentIds: [{ type: String }],
    avatar: { type: String },
    previousSchool: { type: String },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1 });
StudentSchema.index({ parentIds: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);


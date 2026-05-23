import mongoose, { Document, Schema } from 'mongoose';

export interface ISubjectGroup extends Document {
  name: string;
  subjects: string[];
}

const SubjectGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<ISubjectGroup>('SubjectGroup', SubjectGroupSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  name: string;
  subjects: string[];
}

const ProgramSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    subjects: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IProgram>('Program', ProgramSchema);

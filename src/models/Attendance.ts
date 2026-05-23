
import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  note?: string;
}

const AttendanceSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    classId: { type: String, required: true },
    date: { type: String, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    markedBy: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

// Compound index for unique attendance per student per class per day? 
// Or just student per date? Usually one record per day.
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

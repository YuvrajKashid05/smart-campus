import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
        session: {
            type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", required: true
        },
        student: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
        },
        markedAt: {
            type: Date, default: Date.now
        }
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same session+student
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.model("AttendanceRecord", attendanceRecordSchema);
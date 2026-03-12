import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    course: {
      type: String, required: true
    },
    dept: {
      type: String, default: ""
    },
    year: {
      type: Number, default: 1
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
    },
    qrToken: {
      type: String, required: true, unique: true
    },
    expiresAt: {
      type: Date, required: true
    }
  },
  { timestamps: true }
);

// NOTE: TTL auto-delete index REMOVED intentionally.
// Sessions must persist for attendance reporting even after QR expiry.
// The expiresAt field is still used in markAttendance() to reject late submissions.
// Index for fast faculty lookups:
attendanceSessionSchema.index({ startedBy: 1, createdAt: -1 });

export default mongoose.model("AttendanceSession", attendanceSessionSchema);

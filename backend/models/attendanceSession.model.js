import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    course: {
      type: String, required: true
    },
    dept: {
      type: String, default: ""
    },
    section: {
      type: String, default: ""   // e.g. "A", "B" — empty means all sections allowed
    },
    semester: {
      type: Number, default: 0    // 0 means all semesters allowed
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

// Sessions persist — NO TTL auto-delete (needed for attendance reporting)
// expiresAt is still used to reject late student QR scans
attendanceSessionSchema.index({ startedBy: 1, createdAt: -1 });

export default mongoose.model("AttendanceSession", attendanceSessionSchema);

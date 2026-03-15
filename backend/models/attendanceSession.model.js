import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    course:   { type: String, required: true },
    dept:     { type: String, default: "" },
    section:  { type: String, default: "" },
    semester: { type: Number, default: 0 },
    year:     { type: Number, default: 1 },
    startedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    qrToken:  { type: String, required: true, unique: true },
    expiresAt:{ type: Date, required: true },

    // Classroom GPS — set by faculty when starting session
    classroomLocation: {
      lat:           { type: Number, default: null },
      lng:           { type: Number, default: null },
      radiusMeters:  { type: Number, default: 100 }, // allowed radius in metres
      label:         { type: String, default: "" },  // e.g. "Room 204, Block B"
    },
    locationCheckEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ startedBy: 1, createdAt: -1 });
export default mongoose.model("AttendanceSession", attendanceSessionSchema);

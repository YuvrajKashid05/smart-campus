import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    session:  { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
    student:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date, default: Date.now },

    // GPS fraud detection
    studentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    distanceMeters:  { type: Number, default: null },
    locationFlagged: { type: Boolean, default: false },
    flagReason:      { type: String,  default: "" },

    // Device fingerprint — proxy detection
    deviceFingerprint: { type: String, default: null }, // hash of device traits
    deviceInfo:        { type: String, default: null }, // human-readable device string
    proxyFlagged:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceRecordSchema.index({ session: 1, deviceFingerprint: 1 });
export default mongoose.model("AttendanceRecord", attendanceRecordSchema);

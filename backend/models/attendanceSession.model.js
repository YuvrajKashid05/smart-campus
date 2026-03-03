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

// Auto-delete after expiry using TTL index
attendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("AttendanceSession", attendanceSessionSchema);
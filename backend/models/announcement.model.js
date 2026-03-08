import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    audience: {
      type: String,
      enum: ["ALL", "STUDENT", "FACULTY"],
      default: "ALL"
    },

    dept: {
      type: String,
      default: "ALL",
      trim: true,
      uppercase: true
    },

    semester: {
      type: Number,
      min: 1,
      max: 8
    },

    section: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
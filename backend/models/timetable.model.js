import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    dept: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },

    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    day: {
      type: String,
      required: true,
      enum: ["MON", "TUE", "WED", "THU", "FRI"]
    },

    slotType: {
      type: String,
      required: true,
      enum: ["LECTURE", "BREAK"],
      default: "LECTURE"
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    subject: {
      type: String,
      default: "",
      trim: true
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    room: {
      type: String,
      default: "",
      trim: true
    },

    startTime: {
      type: String,
      required: true,
      trim: true
    },

    endTime: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

timetableSchema.index(
  { dept: 1, semester: 1, section: 1, day: 1, startTime: 1 },
  { unique: true }
);

export default mongoose.model("Timetable", timetableSchema);
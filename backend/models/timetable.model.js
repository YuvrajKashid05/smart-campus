import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    dept: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI"],
      required: true,
    },
    slotType: {
      type: String,
      enum: ["LECTURE", "BREAK"],
      default: "LECTURE",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
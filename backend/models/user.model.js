import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["STUDENT", "FACULTY", "ADMIN"],
      default: "STUDENT"
    },

    mobileNumber: {
      type: String,
      default: "",
      trim: true
    },

    dept: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    section: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    semester: {
      type: Number,
      min: 1,
      max: 8
    },

    rollNo: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    employeeId: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.index(
  { dept: 1, section: 1, rollNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      rollNo: { $type: "string", $ne: "" }
    }
  }
);

export default mongoose.model("User", userSchema);
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
        name: {
            type: String, required: true, trim: true
        },

        email: {
            type: String, required: true, unique: true, lowercase: true, trim: true
        },

        passwordHash: {
            type: String, required: true
        },

    role: {
      type: String,
      enum: ["STUDENT", "FACULTY", "ADMIN"],
      default: "STUDENT"
    },
        dept: {
            type: String, default: ""
        },
        rollNo: {
            type: String, default: ""
        },
        employeeId: {
            type: String, default: ""
        },
        isActive: {
            type: Boolean, default: true
        }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
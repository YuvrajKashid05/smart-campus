import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
        category: {
            type: String, enum: ["IT", "FACILITY", "ACADEMIC", "OTHER"], default: "OTHER"
        },
        message: {
            type: String, required: true
        },
        status: {
            type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], default: "OPEN"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", default: null
        }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
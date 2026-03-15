import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ["IT","FACILITY","ACADEMIC","OTHER"], default: "OTHER" },
    message:  { type: String, required: true },
    status:   { type: String, enum: ["OPEN","IN_PROGRESS","RESOLVED"], default: "OPEN" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo:{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // AI-generated fields
    aiPriority:          { type: String, enum: ["HIGH","MEDIUM","LOW",null], default: null },
    aiEstimatedDays:     { type: Number, default: null },
    aiDepartment:        { type: String, default: null },
    aiSuggestedResponse: { type: String, default: null },
    aiTags:              { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);

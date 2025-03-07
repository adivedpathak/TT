import mongoose, { Schema, Document } from "mongoose";

// ✅ Define TypeScript Interface for OMR Results
export interface IOMRResult extends Document {
  username: string;
  userid: string;
  assignment_id: string;
  assignment_topic: string;
  omr_results: Record<string, string>; // JSON object storing answers
  success: boolean;
  timestamp: Date;
}

// ✅ Define Mongoose Schema
const OMRResultSchema = new Schema<IOMRResult>({
  username: { type: String, required: true },
  userid: { type: String, required: true },
  assignment_id: { type: String, required: true },
  assignment_topic: { type: String, required: true },
  omr_results: { type: Schema.Types.Mixed, required: true }, // Stores JSON object
  success: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});

// ✅ Export Model
const OMRResultModel = mongoose.model<IOMRResult>("OMRResult", OMRResultSchema);
export default OMRResultModel;

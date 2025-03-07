import mongoose from 'mongoose';

const omrSchema = new mongoose.Schema({
  username: String,
  userId: String,
  assignmentId: String,
  assignmentTopic: String,
  timestamp: { type: Date, default: Date.now },
  omrResults: Object,
  success: Boolean,
});

export default mongoose.model('OMR', omrSchema);
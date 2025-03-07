import { Request, Response } from "express";
import OMRResultModel from "../models/OMRschema"; // Import the OMR Mongoose model
import { IOMRResult } from "../models/OMRschema"; // Import the interface

// ✅ Store OMR Results
export const storeOMRResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { omr_results, success, username, userid, assignment_id, assignment_topic, timestamp } = req.body;

    // Convert `omr_results` from string to JSON object
    const parsedOmrResults = typeof omr_results === "string" ? JSON.parse(omr_results) : omr_results;

    const omrData: Partial<IOMRResult> = {
      omr_results: parsedOmrResults,
      success,
      username,
      userid,
      assignment_id,
      assignment_topic,
      timestamp: timestamp ? new Date(timestamp) : new Date(), // Use provided timestamp or default to current time
    };

    const newOMR = new OMRResultModel(omrData);
    const result = await newOMR.save();

    res.status(201).json({ message: "OMR results stored successfully", result });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to store OMR results", error: error.message });
  }
};

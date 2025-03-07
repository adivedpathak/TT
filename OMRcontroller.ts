import { Request, Response } from 'express';
import OMR from '../models/OMR'; // Import the OMR model

interface OMRResult {
  omr_results: string;
  success: boolean;
  username: string;
  userid: string;
  assignment_id: string;
  assignment_topic: string;
  timestamp: string;
}

export const storeOMRResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { omr_results, success, username, userid, assignment_id, assignment_topic, timestamp }: OMRResult = req.body;

    const omrResult = new OMR({
      omrResults: omr_results,
      success,
      username,
      userId: userid,
      assignmentId: assignment_id,
      assignmentTopic: assignment_topic,
      timestamp
    });

    const result = await omrResult.save();

    res.status(200).json({ message: 'OMR results stored successfully', result });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to store OMR results', error: (error as Error).message });
  }
};
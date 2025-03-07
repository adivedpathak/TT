import { Request, Response } from "express";
import { Document } from "mongoose";
const Timetable = require("../models/TTschema");

interface ILecture {
  time: string;
  subject: string;
  topic: string;
  completed: boolean;
}

interface IDay {
  day: string;
  schedule: ILecture[];
}

interface IWeek {
  weekNumber: number;
  days: IDay[];
}

interface ITimetable extends Document {
  teacherId: string;
  weeks: IWeek[];
}

exports.storeTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, weeks }: { teacherId: string; weeks: IWeek[] } = req.body;
    const newTimetable = new Timetable({ teacherId, weeks });

    await newTimetable.save();
    res.status(201).json({ message: "Timetable stored successfully!" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

exports.getTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const timetable = await Timetable.findOne({ teacherId });

    if (!timetable) {
      res.status(404).json({ message: "Timetable not found" });
      return;
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

exports.updateTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const { weeks }: { weeks: IWeek[] } = req.body;

    const timetable = await Timetable.findOneAndUpdate({ teacherId }, { weeks }, { new: true });

    if (!timetable) {
      res.status(404).json({ message: "Timetable not found" });
      return;
    }

    res.json({ message: "Timetable updated successfully!", timetable });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

exports.deleteTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;

    const timetable = await Timetable.findOneAndDelete({ teacherId });

    if (!timetable) {
      res.status(404).json({ message: "Timetable not found" });
      return;
    }

    res.json({ message: "Timetable deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
exports.getPendingLectures = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    console.log("Request received for teacherId:", teacherId); // Add this line
    const timetable = await Timetable.findOne({ teacherId });

    if (!timetable) {
      res.status(404).json({ message: "Timetable not found" });
      return;
    }

    const pendingLectures: ILecture[] = [];

    timetable.weeks.forEach((week: IWeek) => {
      week.days.forEach((day: IDay) => {
        day.schedule.forEach((lecture: ILecture) => {
          if (!lecture.completed) {
            pendingLectures.push(lecture);
          }
        });
      });
    });

    console.log("Pending lectures:", pendingLectures);
    res.json(pendingLectures);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
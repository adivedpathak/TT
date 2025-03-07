const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema({
  time: String,
  subject: String,
  topic: String,
  completed: { type: Boolean, default: false },
});

const DaySchema = new mongoose.Schema({
  day: String,
  schedule: [LectureSchema],
});

const WeekSchema = new mongoose.Schema({
  weekNumber: Number,
  days: [DaySchema],
});

const TimetableSchema = new mongoose.Schema({
  teacherId: String,
  weeks: [WeekSchema],
});

module.exports = mongoose.model("Timetable", TimetableSchema);

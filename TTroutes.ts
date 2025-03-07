import { Router } from "express";
import { catchError } from "../middlewares/catchError";
const TTcontroller = require("../controllers/TTcontroller");

const TTrouter = Router();

TTrouter.post("/storetimetable", catchError(TTcontroller.storeTimetable));
TTrouter.get("/getTimetable/:teacherId", catchError(TTcontroller.getTimetable));
TTrouter.put("/updateTimetable/:teacherId", catchError(TTcontroller.updateTimetable));
TTrouter.delete("/deleteTimetable/:teacherId", catchError(TTcontroller.deleteTimetable));
TTrouter.get("/getPendingLectures/:teacherId", catchError(TTcontroller.getPendingLectures));

export { TTrouter };
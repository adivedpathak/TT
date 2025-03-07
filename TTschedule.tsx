import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface FormData {
  num_weeks: number;
  start_time: string;
  end_time: string;
  lecture_duration: number;
  list_of_days: string[];
}

interface Timetable {
  week: number;
  days: {
    day: string;
    schedule: {
      time: string;
      subject: string;
      topic: string;
      status?: string;
    }[];
  }[];
}

const TimetableScheduler: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    num_weeks: 1,
    start_time: "",
    end_time: "",
    lecture_duration: 1,
    list_of_days: [],
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [timetable, setTimetable] = useState<Timetable[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingLectures, setPendingLectures] = useState<Timetable[] | null>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "lecture_duration" || name === "num_weeks" ? Number(value) : value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  // Handle checkbox selection for days
  const handleDaySelection = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      list_of_days: prev.list_of_days.includes(day)
        ? prev.list_of_days.filter((d) => d !== day) // Remove if already selected
        : [...prev.list_of_days, day], // Add if not selected
    }));
  };

  // Send API request to generate timetable
  const generateTimetable = async () => {
    if (!files || files.length === 0) {
      alert("Please upload at least one PDF file.");
      return;
    }

    if (!formData.start_time || !formData.end_time || formData.list_of_days.length === 0) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      for (let i = 0; i < files.length; i++) {
        formDataToSend.append("files", files[i]);
      }

      const requestData = {
        ...formData,
        model_name: "gemini-2.0-flash",
      };

      formDataToSend.append("request", JSON.stringify(requestData));

      const response = await axios.post("http://localhost:8000/generate-timetable/", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("TT",response.data.timetable)
      setTimetable(response.data.timetable);
    } catch (error) {
      console.error("Error generating timetable:", error);
      alert("Failed to generate timetable. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending lectures
  const fetchPendingLectures = async () => {
    try {
      const response = await axios.get("http://localhost:8000/timetable/getPendingLectures/teacher123");
      setPendingLectures(response.data);
    } catch (error) {
      console.error("Error fetching pending lectures:", error);
      alert("Failed to fetch pending lectures. Check console for details.");
    }
  };

  // Update lecture status
  const updateLectureStatus = (weekIndex: number, dayIndex: number, lectureIndex: number, newStatus: string) => {
    setTimetable((prev) =>
      prev
        ? prev.map((week, wIdx) =>
            wIdx === weekIndex
              ? {
                  ...week,
                  days: week.days.map((day, dIdx) =>
                    dIdx === dayIndex
                      ? {
                          ...day,
                          schedule: day.schedule.map((lecture, lIdx) =>
                            lIdx === lectureIndex ? { ...lecture, status: newStatus } : lecture
                          ),
                        }
                      : day
                  ),
                }
              : week
          )
        : null
    );
  };

  useEffect(() => {
    fetchPendingLectures();
  }, []);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center text-purple-700">
      <h1 className="text-3xl font-bold mb-6">Dynamic Timetable Scheduler</h1>
      <div className="bg-purple-100 p-6 rounded-xl shadow-lg w-full max-w-xl">
        <label className="block mb-2">Number of Weeks</label>
        <Input type="number" name="num_weeks" value={formData.num_weeks} onChange={handleChange} min={1} />

        <label className="block mt-4">Start Time</label>
        <Input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />

        <label className="block mt-4">End Time</label>
        <Input type="time" name="end_time" value={formData.end_time} onChange={handleChange} />

        <label className="block mt-4">Lecture Duration (hours)</label>
        <Input type="number" name="lecture_duration" value={formData.lecture_duration} onChange={handleChange} min={0.5} step={0.5} />

        <label className="block mt-4">Select Days</label>
        <div className="grid grid-cols-2 gap-2">
          {daysOfWeek.map((day) => (
            <label key={day} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.list_of_days.includes(day)}
                onChange={() => handleDaySelection(day)}
                className="w-4 h-4"
              />
              <span>{day}</span>
            </label>
          ))}
        </div>

        {/* File Upload */}
        <label className="block mt-4">Upload PDF Files</label>
        <Input type="file" multiple accept=".pdf" onChange={handleFileChange} />

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.05 }} className="mt-6">
          <Button className="bg-purple-600 text-white px-6 py-2 rounded-lg" onClick={generateTimetable} disabled={loading}>
            {loading ? "Generating..." : "Generate Timetable"}
          </Button>
        </motion.div>
      </div>

      {/* Display Generated Timetable */}
      {timetable && (
        <div className="mt-10 p-6 bg-purple-200 rounded-xl shadow-lg w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">Generated Timetable</h2>
          {timetable.map((week, weekIndex) => (
            <div key={weekIndex} className="mb-6 p-4 bg-white rounded-lg">
              <h3 className="text-xl font-bold text-center mb-3">Week {week.week}</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-purple-500 text-white">
                    <th>Day</th><th>Time</th><th>Subject</th><th>Topic</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {week.days.map((day, dayIndex) =>
                    day.schedule.map((lecture, lectureIndex) => (
                      <tr key={lectureIndex} className="hover:bg-gray-100">
                        <td>{day.day}</td><td>{lecture.time}</td><td>{lecture.subject}</td><td>{lecture.topic}</td>
                        <td>
                          <select value={lecture.status || "Pending"} onChange={(e) => updateLectureStatus(weekIndex, dayIndex, lectureIndex, e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Conducted">Conducted</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {pendingLectures && (
        <div className="mt-10 p-6 bg-red-200 rounded-xl shadow-lg w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">Pending Lectures</h2>
          {pendingLectures.map((week, weekIndex) => (
            <div key={weekIndex} className="mb-6 p-4 bg-white rounded-lg">
              <h3 className="text-xl font-bold text-center mb-3">Week {week.week}</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-red-500 text-white">
                    <th>Day</th><th>Time</th><th>Subject</th><th>Topic</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {week.days.map((day, dayIndex) =>
                    day.schedule.map((lecture, lectureIndex) => (
                      <tr key={lectureIndex} className="hover:bg-gray-100">
                        <td>{day.day}</td><td>{lecture.time}</td><td>{lecture.subject}</td><td>{lecture.topic}</td>
                        <td>
                          <select value={lecture.status || "Pending"} onChange={(e) => updateLectureStatus(weekIndex, dayIndex, lectureIndex, e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Conducted">Conducted</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableScheduler;
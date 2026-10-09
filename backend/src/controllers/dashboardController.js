const Course = require('../models/Course');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const getAttendancePercentage = async (studentId, courseId) => {
  const totalSessions = await Session.countDocuments({ course: courseId });
  const attended = await Attendance.countDocuments({
    student: studentId,
    course: courseId,
    status: { $in: ['present', 'late'] },
  });
  return totalSessions ? Number(((attended / totalSessions) * 100).toFixed(1)) : 0;
};

const superAdminDashboard = async (req, res) => {
  const [courses, lecturers, students, sessions, attendanceRecords] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'lecturer' }),
    User.countDocuments({ role: 'student' }),
    Session.countDocuments(),
    Attendance.countDocuments({ status: { $in: ['present', 'late'] } }),
  ]);

  return res.json({ courses, lecturers, students, sessions, attendanceRecords });
};

const lecturerDashboard = async (req, res) => {
  const courses = await Course.find({ lecturer: req.user._id }).populate('students', 'firstName lastName');
  const courseIds = courses.map((course) => course._id);
  const sessions = await Session.find({ course: { $in: courseIds } }).sort({ startsAt: -1 });
  const attendance = await Attendance.find({ course: { $in: courseIds } });

  const byStudent = {};
  attendance.forEach((record) => {
    const key = record.student.toString();
    if (!byStudent[key]) {
      byStudent[key] = { total: 0, attended: 0 };
    }
    byStudent[key].total += 1;
    if (['present', 'late'].includes(record.status)) {
      byStudent[key].attended += 1;
    }
  });

  return res.json({
    courses,
    sessions,
    byStudent,
  });
};

const studentDashboard = async (req, res) => {
  const courses = await Course.find({ students: req.user._id });
  const summaries = await Promise.all(
    courses.map(async (course) => ({
      courseId: course._id,
      courseCode: course.code,
      courseName: course.name,
      percentage: await getAttendancePercentage(req.user._id, course._id),
    }))
  );

  return res.json({ summaries });
};

module.exports = { superAdminDashboard, lecturerDashboard, studentDashboard };

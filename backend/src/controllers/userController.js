const User = require('../models/User');
const Course = require('../models/Course');
const { logAudit } = require('../utils/audit');

const createLecturer = async (req, res) => {
  const lecturer = await User.create({ ...req.body, role: 'lecturer' });
  await logAudit({
    actorId: req.user._id,
    action: 'create_lecturer',
    entity: 'User',
    entityId: lecturer._id.toString(),
    changes: { email: lecturer.email },
  });
  return res.status(201).json(lecturer);
};

const createStudent = async (req, res) => {
  const student = await User.create({ ...req.body, role: 'student' });
  await logAudit({
    actorId: req.user._id,
    action: 'create_student',
    entity: 'User',
    entityId: student._id.toString(),
    changes: { email: student.email },
  });
  return res.status(201).json(student);
};

const enrollStudent = async (req, res) => {
  const { studentId, courseId } = req.body;
  const student = await User.findById(studentId);
  const course = await Course.findById(courseId);

  if (!student || student.role !== 'student') {
    return res.status(404).json({ message: 'Student not found' });
  }
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (!student.enrolledCourses.includes(course._id)) {
    student.enrolledCourses.push(course._id);
    await student.save();
  }
  if (!course.students.includes(student._id)) {
    course.students.push(student._id);
    await course.save();
  }

  await logAudit({
    actorId: req.user._id,
    action: 'enroll_student',
    entity: 'Course',
    entityId: course._id.toString(),
    changes: { studentId: student._id.toString() },
  });

  return res.json({ message: 'Student enrolled' });
};

const listUsers = async (req, res) => {
  const { role } = req.query;
  const query = role ? { role } : {};
  const users = await User.find(query).select('-password -refreshToken').sort({ createdAt: -1 });
  return res.json(users);
};

module.exports = { createLecturer, createStudent, enrollStudent, listUsers };

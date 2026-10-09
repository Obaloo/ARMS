const Course = require('../models/Course');
const User = require('../models/User');
const Session = require('../models/Session');
const { logAudit } = require('../utils/audit');

const createCourse = async (req, res) => {
  const { name, code, lecturerId } = req.body;
  const lecturer = await User.findById(lecturerId);
  if (!lecturer || lecturer.role !== 'lecturer') {
    return res.status(400).json({ message: 'Invalid lecturer' });
  }

  const course = await Course.create({ name, code, lecturer: lecturerId });
  if (!lecturer.assignedCourses.includes(course._id)) {
    lecturer.assignedCourses.push(course._id);
    await lecturer.save();
  }

  await logAudit({
    actorId: req.user._id,
    action: 'create_course',
    entity: 'Course',
    entityId: course._id.toString(),
    changes: { name, code, lecturerId },
  });

  return res.status(201).json(course);
};

const listPublicCourses = async (req, res) => {
  const courses = await Course.find({ isActive: true })
    .populate('lecturer', 'firstName lastName email')
    .sort({ code: 1 });

  return res.json(
    courses.map((course) => ({
      ...course.toObject(),
      studentCount: course.students.length,
    }))
  );
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, code, lecturerId, isActive } = req.body;
  const course = await Course.findById(id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (lecturerId && lecturerId.toString() !== course.lecturer.toString()) {
    const oldLecturer = await User.findById(course.lecturer);
    const newLecturer = await User.findById(lecturerId);
    if (!newLecturer || newLecturer.role !== 'lecturer') {
      return res.status(400).json({ message: 'Invalid lecturer' });
    }
    oldLecturer.assignedCourses = oldLecturer.assignedCourses.filter(
      (courseId) => courseId.toString() !== course._id.toString()
    );
    await oldLecturer.save();

    if (!newLecturer.assignedCourses.includes(course._id)) {
      newLecturer.assignedCourses.push(course._id);
      await newLecturer.save();
    }
    course.lecturer = lecturerId;
  }

  if (name) course.name = name;
  if (code) course.code = code;
  if (typeof isActive === 'boolean') course.isActive = isActive;
  await course.save();

  await logAudit({
    actorId: req.user._id,
    action: 'update_course',
    entity: 'Course',
    entityId: course._id.toString(),
    changes: req.body,
  });

  return res.json(course);
};

const listCourses = async (req, res) => {
  let query = {};
  if (req.user.role === 'lecturer') {
    query = {
      $or: [
        { lecturer: req.user._id },
        { _id: { $in: req.user.assignedCourses || [] } }
      ]
    };
  }
  if (req.user.role === 'student') {
    query = { students: req.user._id };
  }

  const courses = await Course.find(query)
    .populate('lecturer', 'firstName lastName email')
    .populate('students', 'firstName lastName email')
    .sort({ createdAt: -1 });

  return res.json(
    courses.map((course) => ({
      ...course.toObject(),
      studentCount: course.students.length,
    }))
  );
};

const enrollSelf = async (req, res) => {
  const { courseCode } = req.body;

  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can self-enroll' });
  }

  const course = await Course.findOne({ code: courseCode.toUpperCase(), isActive: true });
  if (!course) {
    return res.status(404).json({ message: 'Course code not found' });
  }

  if (!req.user.enrolledCourses.some((id) => id.toString() === course._id.toString())) {
    req.user.enrolledCourses.push(course._id);
    await req.user.save();
  }

  if (!course.students.some((id) => id.toString() === req.user._id.toString())) {
    course.students.push(req.user._id);
    await course.save();
  }

  await logAudit({
    actorId: req.user._id,
    action: 'self_enroll_course',
    entity: 'Course',
    entityId: course._id.toString(),
    changes: { courseCode: course.code },
  });

  return res.json({ message: `Enrolled in ${course.code}` });
};

const getCourseOverview = async (req, res) => {
  const { id } = req.params;
  const course = await Course.findById(id)
    .populate('lecturer', 'firstName lastName email')
    .populate('students', 'firstName lastName email');

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const totalSessions = await Session.countDocuments({ course: id });
  const totalStudents = course.students.length;

  return res.json({ ...course.toObject(), totalSessions, totalStudents });
};

module.exports = {
  createCourse,
  updateCourse,
  listCourses,
  listPublicCourses,
  enrollSelf,
  getCourseOverview,
};

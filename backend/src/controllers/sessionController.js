const Course = require('../models/Course');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const { logAudit } = require('../utils/audit');

const generateCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const getCodeExpiry = (rotationSeconds) => {
  if (!rotationSeconds) {
    return null;
  }
  return new Date(Date.now() + rotationSeconds * 1000);
};

const rotateSessionCodeIfNeeded = async (session) => {
  if (!session.isOpen) {
    return session;
  }

  if (!session.codeRotationSeconds) {
    if (!session.attendanceCode) {
      session.attendanceCode = generateCode();
      await session.save();
    }
    return session;
  }

  const expiresAt = session.attendanceCodeExpiresAt ? new Date(session.attendanceCodeExpiresAt) : null;
  const now = new Date();

  if (!expiresAt || now >= expiresAt) {
    session.attendanceCode = generateCode();
    session.attendanceCodeExpiresAt = getCodeExpiry(session.codeRotationSeconds || 60);
    await session.save();
  }

  return session;
};

const markAbsentStudentsForSession = async (session) => {
  const students = session.course?.students || [];
  if (!students.length) {
    return;
  }

  const existing = await Attendance.find({ session: session._id }).select('student');
  const existingSet = new Set(existing.map((item) => item.student.toString()));

  const absentDocs = students
    .filter((studentId) => !existingSet.has(studentId.toString()))
    .map((studentId) => ({
      student: studentId,
      course: session.course._id,
      session: session._id,
      status: 'absent',
      submittedAt: new Date(session.endsAt),
    }));

  if (absentDocs.length) {
    await Attendance.insertMany(absentDocs, { ordered: false });
  }
};

const createSession = async (req, res) => {
  const { courseId, title, startsAt, endsAt, lateCutoffMinutes, codeRotationSeconds } = req.body;
  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role === 'lecturer' && course.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const parsedRotation = [0, 30, 60].includes(Number(codeRotationSeconds))
    ? Number(codeRotationSeconds)
    : 60;

  const session = await Session.create({
    course: course._id,
    lecturer: course.lecturer,
    title,
    attendanceCode: generateCode(),
    attendanceCodeExpiresAt: getCodeExpiry(parsedRotation),
    codeRotationSeconds: parsedRotation,
    startsAt,
    endsAt,
    lateCutoffMinutes: lateCutoffMinutes || 15,
  });

  await Notification.insertMany(
    course.students.map((studentId) => ({
      user: studentId,
      title: 'New Attendance Session',
      message: `${course.code} session is now open: ${title}`,
      type: 'info',
      meta: { sessionId: session._id, courseId: course._id },
    }))
  );

  await logAudit({
    actorId: req.user._id,
    action: 'create_session',
    entity: 'Session',
    entityId: session._id.toString(),
    changes: req.body,
  });

  return res.status(201).json(session);
};

const setSessionState = async (req, res) => {
  const { id } = req.params;
  const { isOpen } = req.body;
  const session = await Session.findById(id).populate('course');

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (req.user.role === 'lecturer' && session.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const wasOpen = session.isOpen;
  session.isOpen = isOpen;
  if (isOpen) {
    session.attendanceCode = generateCode();
    session.attendanceCodeExpiresAt = getCodeExpiry(session.codeRotationSeconds);
  }
  await session.save();

  if (wasOpen && !isOpen) {
    await markAbsentStudentsForSession(session);
  }

  await logAudit({
    actorId: req.user._id,
    action: 'set_session_state',
    entity: 'Session',
    entityId: session._id.toString(),
    changes: { isOpen },
  });

  return res.json(session);
};

const setSessionHeadcount = async (req, res) => {
  const { id } = req.params;
  const { actualHeadcount } = req.body;
  const parsedHeadcount = Number(actualHeadcount);

  if (!Number.isInteger(parsedHeadcount) || parsedHeadcount < 1) {
    return res.status(400).json({ message: 'Headcount must be a positive whole number' });
  }

  const session = await Session.findById(id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (req.user.role === 'lecturer' && session.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  session.actualHeadcount = parsedHeadcount;
  await session.save();

  await Attendance.updateMany(
    {
      session: session._id,
      falseAttendanceReason: 'seat_number_above_headcount',
      seatNumber: { $lte: parsedHeadcount },
    },
    {
      $set: {
        isFalseAttendance: false,
        headcountInvalidated: false,
      },
      $unset: {
        falseAttendanceReason: '',
        headcountInvalidatedAt: '',
      },
    }
  );

  await Attendance.updateMany(
    {
      session: session._id,
      seatNumber: { $gt: parsedHeadcount },
    },
    {
      $set: {
        isFalseAttendance: true,
        falseAttendanceReason: 'seat_number_above_headcount',
        headcountInvalidated: true,
        headcountInvalidatedAt: new Date(),
      },
    }
  );

  await logAudit({
    actorId: req.user._id,
    action: 'set_session_headcount',
    entity: 'Session',
    entityId: session._id.toString(),
    changes: { actualHeadcount: parsedHeadcount },
  });

  return res.json(session);
};

const listSessions = async (req, res) => {
  const { courseId } = req.query;
  let query = {};
  if (courseId) {
    query.course = courseId;
  }

  if (req.user.role === 'lecturer') {
    query.lecturer = req.user._id;
  }

  if (req.user.role === 'student') {
    const courses = req.user.enrolledCourses || [];
    query.course = { $in: courses };
  }

  const sessions = await Session.find(query)
    .populate('course', 'name code')
    .populate('lecturer', 'firstName lastName')
    .sort({ startsAt: -1 });

  await Promise.all(sessions.map((session) => rotateSessionCodeIfNeeded(session)));

  return res.json(sessions);
};

const deleteSession = async (req, res) => {
  const { id } = req.params;
  const session = await Session.findById(id).populate('course');

  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (req.user.role === 'lecturer' && session.lecturer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await Attendance.deleteMany({ session: session._id });
  await Session.findByIdAndDelete(id);

  await logAudit({
    actorId: req.user._id,
    action: 'delete_session',
    entity: 'Session',
    entityId: session._id.toString(),
    changes: { title: session.title, courseId: session.course._id },
  });

  return res.json({ message: 'Session deleted successfully' });
};

module.exports = { createSession, setSessionState, setSessionHeadcount, listSessions, rotateSessionCodeIfNeeded, deleteSession };

const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const PDFDocument = require('pdfkit');
const { sendEmail } = require('../utils/mailer');
const { logAudit } = require('../utils/audit');
const { reverseGeocode } = require('../utils/reverseGeocode');
const { rotateSessionCodeIfNeeded } = require('./sessionController');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getStatusByTime = (session, submittedAt) => {
  const lateTime = new Date(new Date(session.startsAt).getTime() + session.lateCutoffMinutes * 60000);
  if (submittedAt > lateTime) {
    return 'late';
  }
  return 'present';
};

const downloadSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId).populate('course', 'code title');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.lecturer.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Not authorized to download attendance for this session' });
    }

    const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'firstName lastName email matricNumber')
      .sort({ seatNumber: 1 });

    const enrolledStudents = await User.find({
      enrolledCourses: session.course._id,
      role: 'student',
      isActive: true
    }).select('firstName lastName email matricNumber');

    const attendedStudentIds = attendanceRecords.map(record => record.student._id.toString());
    const absentStudents = enrolledStudents.filter(student =>
      !attendedStudentIds.includes(student._id.toString())
    );

    const courseCode = session.course?.code || 'Unknown';
    const sessionDate = new Date(session.startsAt).toISOString().split('T')[0];
    const filename = `attendance_${courseCode}_${sessionDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(16).text(`Attendance Report - ${courseCode}`, { align: 'center' });
    doc.fontSize(10).text(`Session: ${session.title}`, { align: 'center' });
    doc.fontSize(10).text(`Date: ${sessionDate}`, { align: 'center' });
    doc.moveDown();

    const pageWidth = doc.page.width - 60;
    const colWidth = pageWidth / 5;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Seat', 30, doc.y, { width: colWidth });
    doc.text('Matric', 30 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth });
    doc.text('Name', 30 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth });
    doc.text('Email', 30 + colWidth * 3, doc.y - doc.currentLineHeight(), { width: colWidth });
    doc.text('Status', 30 + colWidth * 4, doc.y - doc.currentLineHeight(), { width: colWidth });
    doc.moveDown();

    doc.font('Helvetica');
    attendanceRecords.forEach((record) => {
      doc.fontSize(8);
      doc.text(record.seatNumber || '', 30, doc.y, { width: colWidth });
      doc.text(record.student.matricNumber || '', 30 + colWidth, doc.y - doc.currentLineHeight(), { width: colWidth });
      doc.text(`${record.student.firstName} ${record.student.lastName}`, 30 + colWidth * 2, doc.y - doc.currentLineHeight(), { width: colWidth });
      doc.text(record.student.email, 30 + colWidth * 3, doc.y - doc.currentLineHeight(), { width: colWidth });
      doc.text(record.status, 30 + colWidth * 4, doc.y - doc.currentLineHeight(), { width: colWidth });
      doc.moveDown(0.5);
    });

    if (absentStudents.length > 0) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('Absent Students', { underline: true });
      doc.font('Helvetica');
      absentStudents.forEach((student) => {
        doc.fontSize(8).text(`${student.firstName} ${student.lastName} (${student.matricNumber || 'N/A'})`);
      });
    }

    doc.end();

    await logAudit({
      actorId: req.user._id,
      action: 'download_attendance',
      entity: 'Attendance',
      entityId: sessionId,
      changes: { format: 'pdf', courseCode, sessionDate }
    });

  } catch (error) {
    console.error('Error downloading session attendance:', error);
    res.status(500).json({ message: 'Failed to download attendance report' });
  }
};

const checkSeatAvailability = async (req, res) => {
  const { sessionCode, seatNumber } = req.query;
  const parsedSeatNumber = Number(seatNumber);

  if (!sessionCode) {
    return res.status(400).json({ message: 'Session code is required' });
  }

  if (!Number.isInteger(parsedSeatNumber) || parsedSeatNumber < 1) {
    return res.status(400).json({ message: 'Seat number must be a positive whole number' });
  }

  const session = await Session.findOne({ attendanceCode: sessionCode });
  if (!session) {
    return res.status(404).json({ available: false, message: 'Invalid session code' });
  }

  const now = new Date();
  if (session.attendanceCodeExpiresAt && now >= new Date(session.attendanceCodeExpiresAt)) {
    await rotateSessionCodeIfNeeded(session);
    return res.status(400).json({ available: false, message: 'Session code expired. Request the latest code from your lecturer.' });
  }

  const seatExists = await Attendance.exists({ session: session._id, seatNumber: parsedSeatNumber });
  if (seatExists) {
    return res.json({ available: false, message: `Seat number ${parsedSeatNumber} is already used by another student` });
  }

  return res.json({ available: true, message: `Seat number ${parsedSeatNumber} is available` });
};

const markAttendance = async (req, res) => {
  try {
    const { sessionCode, latitude, longitude, accuracy, seatNumber } = req.body;
    const session = await Session.findOne({ attendanceCode: sessionCode }).populate('course');

    if (!session) {
      return res.status(404).json({ message: 'Invalid session code' });
    }

    const now = new Date();
    if (session.attendanceCodeExpiresAt && now >= new Date(session.attendanceCodeExpiresAt)) {
      await rotateSessionCodeIfNeeded(session);
      return res.status(400).json({ message: 'Session code expired. Request the latest code from your lecturer.' });
    }

    if (!session.isOpen) {
      return res.status(400).json({ message: 'Session is closed' });
    }

    if (now < new Date(session.startsAt) || now > new Date(session.endsAt)) {
      return res.status(400).json({ message: 'Session not active in this time window' });
    }

    const parsedSeatNumber = Number(seatNumber);
    if (!Number.isInteger(parsedSeatNumber) || parsedSeatNumber < 1) {
      return res.status(400).json({ message: 'Seat number must be a positive whole number' });
    }

    const enrolled = session.course.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );
    if (!enrolled) {
      return res.status(403).json({ message: 'You are not enrolled for this course' });
    }

    const settings = (await SystemSetting.findOne()) || (await SystemSetting.create({}));
    if (settings.featureFlags.geolocationRequired && (latitude == null || longitude == null)) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const existing = await Attendance.findOne({ student: req.user._id, session: session._id });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already submitted' });
    }

    const takenSeat = await Attendance.findOne({ session: session._id, seatNumber: parsedSeatNumber }).select('_id');
    if (takenSeat) {
      return res.status(409).json({ message: `Seat number ${parsedSeatNumber} has already been used for this session` });
    }

    const status = getStatusByTime(session, now);
    const resolvedAddress = await reverseGeocode({ latitude, longitude });

    const attendance = await Attendance.create({
      student: req.user._id,
      course: session.course._id,
      session: session._id,
      status,
      seatNumber: parsedSeatNumber,
      location: {
        latitude,
        longitude,
        accuracy,
        displayName: resolvedAddress?.displayName,
        city: resolvedAddress?.city,
        state: resolvedAddress?.state,
        country: resolvedAddress?.country,
      },
      submittedAt: now,
    });

    await Notification.create({
      user: req.user._id,
      title: 'Attendance Recorded',
      message: `${session.course.code} ${session.title} marked as ${status}`,
      type: 'success',
      meta: { sessionId: session._id },
    });

    const studentAttendances = await Attendance.countDocuments({
      student: req.user._id,
      course: session.course._id,
      status: { $in: ['present', 'late'] },
    });
    const totalSessions = await Session.countDocuments({ course: session.course._id });
    const percentage = totalSessions ? (studentAttendances / totalSessions) * 100 : 0;

    if (settings.featureFlags.emailAlertsEnabled && percentage < settings.lowAttendanceThreshold) {
      const lecturer = await User.findById(session.lecturer);
      if (lecturer) {
        await sendEmail({
          to: lecturer.email,
          subject: 'Low Attendance Alert',
          html: `<p>${req.user.firstName} ${req.user.lastName} is below threshold at ${percentage.toFixed(1)}% in ${session.course.code}.</p>`,
        });
      }
    }

    await logAudit({
      actorId: req.user._id,
      action: 'mark_attendance',
      entity: 'Attendance',
      entityId: attendance._id.toString(),
      changes: { status },
    });

    return res.status(201).json(attendance);
  } catch (error) {
    if (error?.code === 11000) {
      if (error?.keyPattern?.session && error?.keyPattern?.seatNumber) {
        return res.status(409).json({ message: 'Seat number has already been used for this session' });
      }
      return res.status(409).json({ message: 'Attendance already submitted' });
    }
    throw error;
  }
};

const overrideAttendance = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const attendance = await Attendance.findById(id).populate('session');

  if (!attendance) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }

  if (
    req.user.role === 'lecturer' &&
    attendance.session.lecturer.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  attendance.status = status;
  attendance.overriddenBy = req.user._id;
  await attendance.save();

  await logAudit({
    actorId: req.user._id,
    action: 'override_attendance',
    entity: 'Attendance',
    entityId: attendance._id.toString(),
    changes: { status },
  });

  return res.json(attendance);
};

const listAttendance = async (req, res) => {
  const { courseId, sessionId, studentId, status, page, limit, includeMeta, search, matricNumber } = req.query;
  const query = {};
  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 300);
  const skip = (parsedPage - 1) * parsedLimit;

  const sendList = async () => {
    const [records, total] = await Promise.all([
      Attendance.find(query)
      .populate('student', 'firstName lastName email matricNumber')
      .populate('course', 'name code')
      .populate('session', 'title startsAt endsAt')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
      Attendance.countDocuments(query),
    ]);

    if (includeMeta === '1' || includeMeta === 'true') {
      return res.json({
        records,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.max(Math.ceil(total / parsedLimit), 1),
        },
      });
    }

    return res.json(records);
  };

  if (courseId) query.course = courseId;
  if (sessionId) query.session = sessionId;
  if (studentId) query.student = studentId;

  if (status) {
    if (status === 'not_absent') {
      query.status = { $in: ['present', 'late'] };
    } else if (['present', 'late', 'absent'].includes(status)) {
      query.status = status;
    }
  }

  if (req.user.role === 'student') {
    query.student = req.user._id;
  }

  if (req.user.role === 'lecturer') {
    const courses = await Course.find({ lecturer: req.user._id }).select('_id');
    const allowedCourseIds = courses.map((course) => course._id.toString());

    if (query.course) {
      if (!allowedCourseIds.includes(query.course.toString())) {
        if (includeMeta === '1' || includeMeta === 'true') {
          return res.json({
            records: [],
            pagination: {
              page: parsedPage,
              limit: parsedLimit,
              total: 0,
              totalPages: 1,
            },
          });
        }
        return res.json([]);
      }
    } else {
      query.course = { $in: courses.map((course) => course._id) };
    }
  }

  if ((search || matricNumber) && req.user.role !== 'student') {
    const criteria = [{ role: 'student' }];

    if (search) {
      const term = new RegExp(escapeRegex(search.trim()), 'i');
      criteria.push({
        $or: [
          { firstName: term },
          { lastName: term },
          { email: term },
          { matricNumber: term },
        ],
      });
    }

    if (matricNumber) {
      const matricTerm = new RegExp(escapeRegex(matricNumber.trim()), 'i');
      criteria.push({ matricNumber: matricTerm });
    }

    const students = await User.find({ $and: criteria }).select('_id');
    if (!students.length) {
      if (includeMeta === '1' || includeMeta === 'true') {
        return res.json({
          records: [],
          pagination: {
            page: parsedPage,
            limit: parsedLimit,
            total: 0,
            totalPages: 1,
          },
        });
      }
      return res.json([]);
    }

    const studentIds = students.map((item) => item._id.toString());
    if (query.student) {
      if (!studentIds.includes(query.student.toString())) {
        if (includeMeta === '1' || includeMeta === 'true') {
          return res.json({
            records: [],
            pagination: {
              page: parsedPage,
              limit: parsedLimit,
              total: 0,
              totalPages: 1,
            },
          });
        }
        return res.json([]);
      }
    } else {
      query.student = { $in: students.map((item) => item._id) };
    }
  }

  return sendList();
};

module.exports = { markAttendance, overrideAttendance, listAttendance, checkSeatAvailability, downloadSessionAttendance };

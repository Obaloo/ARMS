require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const SystemSetting = require('../models/SystemSetting');

const ensureUser = async (payload) => {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    existing.firstName = payload.firstName;
    existing.lastName = payload.lastName;
    if (payload.matricNumber) {
      existing.matricNumber = payload.matricNumber;
    }
    existing.role = payload.role;
    existing.isActive = true;
    existing.password = payload.password;
    await existing.save();
    return existing;
  }

  return User.create(payload);
};

const main = async () => {
  await connectDb();

  const superAdmin = await ensureUser({
    firstName: 'Default',
    lastName: 'Admin',
    email: 'admin@arms.local',
    password: 'Admin123!',
    role: 'super_admin',
  });

  const lecturer = await ensureUser({
    firstName: 'Default',
    lastName: 'Lecturer',
    email: 'lecturer@arms.local',
    password: 'Lecturer123!',
    role: 'lecturer',
  });

  const studentA = await ensureUser({
    firstName: 'Default',
    lastName: 'StudentOne',
    matricNumber: 'ARMS/STU/001',
    email: 'student1@arms.local',
    password: 'Student123!',
    role: 'student',
  });

  const studentB = await ensureUser({
    firstName: 'Default',
    lastName: 'StudentTwo',
    matricNumber: 'ARMS/STU/002',
    email: 'student2@arms.local',
    password: 'Student123!',
    role: 'student',
  });

  let course = await Course.findOne({ code: 'CSC101' });
  if (!course) {
    course = await Course.create({
      name: 'Introduction to Computer Science',
      code: 'CSC101',
      lecturer: lecturer._id,
      students: [studentA._id, studentB._id],
      isActive: true,
    });
  } else {
    course.name = 'Introduction to Computer Science';
    course.lecturer = lecturer._id;
    course.students = [studentA._id, studentB._id];
    course.isActive = true;
    await course.save();
  }

  lecturer.assignedCourses = [course._id];
  studentA.enrolledCourses = [course._id];
  studentB.enrolledCourses = [course._id];
  await lecturer.save();
  await studentA.save();
  await studentB.save();

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60000);
  const end = new Date(now.getTime() + 60 * 60000);

  let session = await Session.findOne({ course: course._id, title: 'Week 1 Lecture' });
  if (!session) {
    session = await Session.create({
      course: course._id,
      lecturer: lecturer._id,
      title: 'Week 1 Lecture',
      attendanceCode: 'ARMS01',
      startsAt: start,
      endsAt: end,
      isOpen: true,
      lateCutoffMinutes: 15,
    });
  } else {
    session.lecturer = lecturer._id;
    session.attendanceCode = 'ARMS01';
    session.startsAt = start;
    session.endsAt = end;
    session.isOpen = true;
    session.lateCutoffMinutes = 15;
    await session.save();
  }

  await Attendance.findOneAndUpdate(
    { student: studentA._id, session: session._id },
    {
      student: studentA._id,
      course: course._id,
      session: session._id,
      status: 'present',
      location: { latitude: 6.5244, longitude: 3.3792, accuracy: 30 },
      submittedAt: new Date(now.getTime() - 10 * 60000),
    },
    { upsert: true, new: true }
  );

  await Attendance.findOneAndUpdate(
    { student: studentB._id, session: session._id },
    {
      student: studentB._id,
      course: course._id,
      session: session._id,
      status: 'late',
      location: { latitude: 6.4654, longitude: 3.4064, accuracy: 40 },
      submittedAt: new Date(now.getTime() - 2 * 60000),
    },
    { upsert: true, new: true }
  );

  await SystemSetting.findOneAndUpdate(
    {},
    {
      organizationName: 'ARMS Demo School',
      logoUrl: '',
      notificationsEnabled: true,
      featureFlags: {
        geolocationRequired: true,
        emailAlertsEnabled: false,
      },
      lowAttendanceThreshold: 75,
    },
    { upsert: true, new: true }
  );

  console.log('Default seed completed');
  console.log('Super Admin: admin@arms.local / Admin123!');
  console.log('Lecturer: lecturer@arms.local / Lecturer123!');
  console.log('Student A: student1@arms.local / Student123!');
  console.log('Student B: student2@arms.local / Student123!');
  console.log('Default session code: ARMS01');

  await mongoose.connection.close();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});

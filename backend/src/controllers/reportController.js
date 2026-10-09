const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');
const Attendance = require('../models/Attendance');

const getReportData = async ({ from, to, courseId }) => {
  const query = {};
  if (from || to) {
    query.submittedAt = {};
    if (from) query.submittedAt.$gte = new Date(from);
    if (to) query.submittedAt.$lte = new Date(to);
  }
  if (courseId) {
    query.course = courseId;
  }

  return Attendance.find(query)
    .populate('student', 'firstName lastName email')
    .populate('course', 'name code')
    .populate('session', 'title startsAt')
    .sort({ submittedAt: -1 });
};

const attendanceReportJson = async (req, res) => {
  const data = await getReportData(req.query);
  return res.json(data);
};

const attendanceReportCsv = async (req, res) => {
  const data = await getReportData(req.query);
  const rows = data.map((item) => ({
    student: `${item.student.firstName} ${item.student.lastName}`,
    email: item.student.email,
    course: item.course.code,
    session: item.session.title,
    status: item.status,
    submittedAt: item.submittedAt.toISOString(),
    latitude: item.location?.latitude ?? '',
    longitude: item.location?.longitude ?? '',
  }));

  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
  return res.send(csv);
};

const attendanceReportPdf = async (req, res) => {
  const data = await getReportData(req.query);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.pdf"');

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text('Attendance Report');
  doc.moveDown();

  data.forEach((item, index) => {
    doc
      .fontSize(10)
      .text(
        `${index + 1}. ${item.student.firstName} ${item.student.lastName} | ${item.course.code} | ${item.session.title} | ${item.status} | ${item.submittedAt.toISOString()}`
      );
  });

  doc.end();
};

module.exports = { attendanceReportJson, attendanceReportCsv, attendanceReportPdf };

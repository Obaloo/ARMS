const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    seatNumber: { type: Number, min: 1 },
    isFalseAttendance: { type: Boolean, default: false },
    falseAttendanceReason: { type: String, trim: true },
    headcountInvalidated: { type: Boolean, default: false },
    headcountInvalidatedAt: { type: Date },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      displayName: String,
      city: String,
      state: String,
      country: String,
    },
    submittedAt: { type: Date, default: Date.now },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, session: 1 }, { unique: true });
attendanceSchema.index(
  { session: 1, seatNumber: 1 },
  { unique: true, partialFilterExpression: { seatNumber: { $exists: true } } }
);
attendanceSchema.index({ course: 1, status: 1, submittedAt: -1 });
attendanceSchema.index({ session: 1, status: 1, submittedAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

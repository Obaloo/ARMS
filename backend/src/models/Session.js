const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    attendanceCode: { type: String, required: true, trim: true },
    attendanceCodeExpiresAt: { type: Date },
    codeRotationSeconds: { type: Number, enum: [0, 30, 60], default: 60 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isOpen: { type: Boolean, default: true },
    lateCutoffMinutes: { type: Number, default: 15 },
    actualHeadcount: { type: Number, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);

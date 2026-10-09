const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    matricNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['super_admin', 'lecturer', 'student'], required: true },
    isActive: { type: Boolean, default: true },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    refreshToken: { type: String },
    attendanceThreshold: { type: Number, default: 75 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave() {
  if (this.role === 'student' && !this.matricNumber) {
    throw new Error('Matric number is required for students');
  }

  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);

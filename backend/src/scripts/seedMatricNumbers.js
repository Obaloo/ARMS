require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const generateMatricNumber = (index) => {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(4, '0');
  return `ARMS/${year}/${paddedIndex}`;
};

const seedMatricNumbers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all students without matric numbers
    const studentsWithoutMatric = await User.find({
      role: 'student',
      matricNumber: { $in: [null, '', undefined] }
    });

    console.log(`Found ${studentsWithoutMatric.length} students without matric numbers`);

    if (studentsWithoutMatric.length === 0) {
      console.log('No students need matric numbers assigned');
      return;
    }

    // Get the highest existing matric number index
    const existingStudents = await User.find({
      role: 'student',
      matricNumber: { $exists: true, $ne: null, $ne: '' }
    }).sort({ matricNumber: -1 });

    let startIndex = 1;
    if (existingStudents.length > 0) {
      const lastMatric = existingStudents[0].matricNumber;
      const match = lastMatric.match(/ARMS\/\d+\/(\d+)$/);
      if (match) {
        startIndex = parseInt(match[1]) + 1;
      }
    }

    console.log(`Starting matric number generation from index: ${startIndex}`);

    // Update each student with a unique matric number
    for (let i = 0; i < studentsWithoutMatric.length; i++) {
      const student = studentsWithoutMatric[i];
      const matricNumber = generateMatricNumber(startIndex + i);
      
      await User.findByIdAndUpdate(student._id, { matricNumber });
      console.log(`Assigned matric number ${matricNumber} to ${student.firstName} ${student.lastName} (${student.email})`);
    }

    console.log('Successfully assigned matric numbers to all students');
  } catch (error) {
    console.error('Error seeding matric numbers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedMatricNumbers();

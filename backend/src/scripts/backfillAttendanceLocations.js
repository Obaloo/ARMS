require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../config/db');
const Attendance = require('../models/Attendance');
const { reverseGeocode } = require('../utils/reverseGeocode');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  await connectDb();

  const query = {
    'location.latitude': { $ne: null },
    'location.longitude': { $ne: null },
    $or: [
      { 'location.displayName': { $exists: false } },
      { 'location.displayName': null },
      { 'location.displayName': '' },
    ],
  };

  const total = await Attendance.countDocuments(query);
  console.log(`Found ${total} attendance records needing location backfill.`);

  let updated = 0;
  let skipped = 0;

  const records = await Attendance.find(query)
    .select('_id location')
    .sort({ submittedAt: -1 })
    .lean();

  for (const record of records) {
    const latitude = Number(record.location?.latitude);
    const longitude = Number(record.location?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      skipped += 1;
      continue;
    }

    const resolved = await reverseGeocode({ latitude, longitude });
    if (!resolved) {
      skipped += 1;
      continue;
    }

    await Attendance.updateOne(
      { _id: record._id },
      {
        $set: {
          'location.displayName': resolved.displayName || null,
          'location.city': resolved.city || null,
          'location.state': resolved.state || null,
          'location.country': resolved.country || null,
        },
      }
    );

    updated += 1;

    // Nominatim usage policy recommends low request rate.
    await wait(1100);
  }

  console.log(`Location backfill completed. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.connection.close();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});

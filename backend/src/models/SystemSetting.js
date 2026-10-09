const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    organizationName: { type: String, default: 'CoreNova' },
    logoUrl: { type: String, default: '' },
    notificationsEnabled: { type: Boolean, default: true },
    featureFlags: {
      geolocationRequired: { type: Boolean, default: true },
      emailAlertsEnabled: { type: Boolean, default: true },
    },
    lowAttendanceThreshold: { type: Number, default: 75 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);

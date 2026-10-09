const SystemSetting = require('../models/SystemSetting');
const { logAudit } = require('../utils/audit');

const getSettings = async (req, res) => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({});
  }
  return res.json(settings);
};

const updateSettings = async (req, res) => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({});
  }

  Object.assign(settings, req.body);
  await settings.save();

  await logAudit({
    actorId: req.user._id,
    action: 'update_settings',
    entity: 'SystemSetting',
    entityId: settings._id.toString(),
    changes: req.body,
  });

  return res.json(settings);
};

module.exports = { getSettings, updateSettings };

const https = require('https');

const LOCATION_TIMEOUT_MS = 8000;

const requestJson = (url, headers = {}) => new Promise((resolve, reject) => {
  const req = https.get(
    url,
    {
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      timeout: LOCATION_TIMEOUT_MS,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          return resolve(JSON.parse(data));
        } catch (error) {
          return reject(error);
        }
      });
    }
  );

  req.on('timeout', () => {
    req.destroy(new Error('Request timeout'));
  });

  req.on('error', reject);
});

const pickAddress = (payload = {}) => {
  const address = payload.address || {};
  const city = address.city || address.town || address.village || address.hamlet || null;
  const state = address.state || address.county || null;
  const country = address.country || null;

  return {
    displayName: payload.display_name || null,
    city,
    state,
    country,
  };
};

const pickAddressFromBigDataCloud = (payload = {}) => {
  const city = payload.city || payload.locality || payload.principalSubdivision || null;
  const state = payload.principalSubdivision || null;
  const country = payload.countryName || null;
  const displayName = [payload.locality, payload.city, payload.principalSubdivision, payload.countryName]
    .filter(Boolean)
    .join(', ');

  return {
    displayName: displayName || null,
    city,
    state,
    country,
  };
};

const reverseGeocode = async ({ latitude, longitude }) => {
  if (latitude == null || longitude == null) {
    return null;
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=jsonv2&addressdetails=1&zoom=18`;
    const nominatimData = await requestJson(nominatimUrl, {
      'User-Agent': 'ARMS-Attendance-Platform/1.0',
    });
    const picked = pickAddress(nominatimData);
    if (picked.displayName || picked.city || picked.state || picked.country) {
      return picked;
    }
  } catch (error) {
    // Try fallback provider below.
  }

  try {
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
    const fallbackData = await requestJson(fallbackUrl);
    const picked = pickAddressFromBigDataCloud(fallbackData);
    if (picked.displayName || picked.city || picked.state || picked.country) {
      return picked;
    }
  } catch (error) {
    // No-op, return null below.
  }

  return null;
};

module.exports = { reverseGeocode };

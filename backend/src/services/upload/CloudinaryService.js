// backend/src/services/upload/CloudinaryService.js
// -------------------------------------------------
// Wrapper minimal autour de Cloudinary v2 pour l'upload + signature manuelle

const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload un buffer (image) vers Cloudinary.
 * @param {Buffer} buffer
 * @param {import('cloudinary').UploadApiOptions} options
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
function uploadImage(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
}

/**
 * Genere une signature SHAÃ¢â‚¬â€˜1 pour l'upload cote client.
 * @param {Record<string, any>} params Ã¢â‚¬â€œ parametres upload (timestamp, public_id, etc.)
 */
function signUpload(params = {}) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
}

module.exports = {
  uploadImage,
  signUpload,
  /** expose l'instance cloudinary pour les operations avancees */
  cloudinary,
};

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

const PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const BUCKET = process.env.S3_BUCKET || 'noor-al-ilm-videos';
const CDN_BASE = process.env.CDN_BASE_URL || '';
const LOCAL_BASE = path.join(__dirname, '../../../uploads');

let s3 = null;
if (PROVIDER !== 'local') {
  s3 = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
}

const uploadFile = async (localPath, key, contentType, isPublic = true) => {
  if (PROVIDER === 'local') {
    const dest = path.join(LOCAL_BASE, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(localPath, dest);
    return { key, url: `/uploads/${key}` };
  }
  const stream = fs.createReadStream(localPath);
  const size = fs.statSync(localPath).size;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: stream,
    ContentType: contentType, ContentLength: size,
    ACL: isPublic ? 'public-read' : 'private',
    CacheControl: key.includes('.m3u8') ? 'no-cache' : 'max-age=31536000',
  }));
  return { key, url: CDN_BASE ? `${CDN_BASE}/${key}` : `https://${BUCKET}.s3.amazonaws.com/${key}` };
};

const uploadBuffer = async (buffer, key, contentType, isPublic = true) => {
  if (PROVIDER === 'local') {
    const dest = path.join(LOCAL_BASE, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buffer);
    return { key, url: `/uploads/${key}` };
  }
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buffer,
    ContentType: contentType, ACL: isPublic ? 'public-read' : 'private',
  }));
  return { key, url: CDN_BASE ? `${CDN_BASE}/${key}` : `https://${BUCKET}.s3.amazonaws.com/${key}` };
};

const uploadHLSDirectory = async (localDir, videoId, onProgress) => {
  if (PROVIDER === 'local') {
    return { masterUrl: `/hls/${videoId}/master.m3u8` };
  }
  const files = fs.readdirSync(localDir);
  let done = 0;
  for (const file of files) {
    const ct = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
    await uploadFile(path.join(localDir, file), `hls/${videoId}/${file}`, ct, true);
    onProgress?.(Math.round((++done / files.length) * 100));
  }
  const base = CDN_BASE ? `${CDN_BASE}` : `https://${BUCKET}.s3.amazonaws.com`;
  return { masterUrl: `${base}/hls/${videoId}/master.m3u8` };
};

const getPresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  if (PROVIDER === 'local') return { uploadUrl: `/api/upload/local?key=${encodeURIComponent(key)}`, key };
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn });
  return { uploadUrl, key };
};

const deleteFile = async (key) => {
  if (PROVIDER === 'local') {
    const p = path.join(LOCAL_BASE, key);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return;
  }
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

const getPublicUrl = (key) => {
  if (PROVIDER === 'local') return `/uploads/${key}`;
  return CDN_BASE ? `${CDN_BASE}/${key}` : `https://${BUCKET}.s3.amazonaws.com/${key}`;
};

module.exports = { uploadFile, uploadBuffer, uploadHLSDirectory, getPresignedUploadUrl, deleteFile, getPublicUrl, PROVIDER };

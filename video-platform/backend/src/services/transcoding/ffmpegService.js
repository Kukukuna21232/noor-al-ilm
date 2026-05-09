const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

const QUALITY_PROFILES = [
  { name: '1080p', width: 1920, height: 1080, videoBitrate: '4000k', audioBitrate: '192k', fps: 30 },
  { name: '720p',  width: 1280, height: 720,  videoBitrate: '2500k', audioBitrate: '128k', fps: 30 },
  { name: '480p',  width: 854,  height: 480,  videoBitrate: '1000k', audioBitrate: '128k', fps: 30 },
  { name: '360p',  width: 640,  height: 360,  videoBitrate: '600k',  audioBitrate: '96k',  fps: 24 },
  { name: '240p',  width: 426,  height: 240,  videoBitrate: '300k',  audioBitrate: '64k',  fps: 24 },
];

const getVideoMetadata = (inputPath) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    if (err) return reject(err);
    const video = metadata.streams.find(s => s.codec_type === 'video');
    const audio = metadata.streams.find(s => s.codec_type === 'audio');
    resolve({
      duration: Math.round(metadata.format.duration || 0),
      fileSize: parseInt(metadata.format.size || 0),
      width: video?.width,
      height: video?.height,
      fps: eval(video?.r_frame_rate || '0/1'),
      videoCodec: video?.codec_name,
      audioCodec: audio?.codec_name,
      format: metadata.format.format_name?.split(',')[0],
    });
  });
});

const generateHLS = (inputPath, outputDir, profile, onProgress) =>
  new Promise((resolve, reject) => {
    const segmentPath = path.join(outputDir, `${profile.name}_%03d.ts`);
    const playlistPath = path.join(outputDir, `${profile.name}.m3u8`);
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${profile.width}x${profile.height}`)
      .videoBitrate(profile.videoBitrate)
      .audioBitrate(profile.audioBitrate)
      .fps(profile.fps)
      .outputOptions([
        '-preset fast', '-crf 23', '-pix_fmt yuv420p',
        '-profile:v main', '-level 4.0',
        '-hls_time 6', '-hls_list_size 0',
        '-hls_segment_filename', segmentPath,
        '-hls_flags independent_segments', '-f hls',
      ])
      .output(playlistPath)
      .on('progress', p => onProgress?.(Math.round(p.percent || 0)))
      .on('end', () => resolve(playlistPath))
      .on('error', reject)
      .run();
  });

const generateMasterPlaylist = async (outputDir, profiles) => {
  const masterPath = path.join(outputDir, 'master.m3u8');
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  for (const p of profiles) {
    const bw = parseInt(p.videoBitrate) * 1000;
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${p.width}x${p.height},NAME="${p.name}"\n${p.name}.m3u8\n\n`;
  }
  fs.writeFileSync(masterPath, content);
  return masterPath;
};

const extractThumbnail = (inputPath, outputPath, timestamp = '00:00:05') =>
  new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    ffmpeg(inputPath)
      .screenshots({ timestamps: [timestamp], filename: path.basename(outputPath), folder: dir, size: '1280x720' })
      .on('end', resolve)
      .on('error', reject);
  });

const runTranscodingPipeline = async (inputPath, videoId, onProgress) => {
  const outputDir = path.join(__dirname, '../../../hls', videoId);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const metadata = await getVideoMetadata(inputPath);
  logger.info(`Transcoding ${videoId}: ${metadata.width}x${metadata.height}, ${metadata.duration}s`);

  const profiles = QUALITY_PROFILES.filter(p => p.height <= (metadata.height || 1080));
  if (profiles.length === 0) profiles.push(QUALITY_PROFILES[QUALITY_PROFILES.length - 1]);

  const completedProfiles = [];
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    await generateHLS(inputPath, outputDir, profile, pct => {
      onProgress?.(Math.round(((i / profiles.length) + (pct / 100 / profiles.length)) * 100));
    });
    completedProfiles.push({
      quality: profile.name,
      width: profile.width,
      height: profile.height,
      bitrate: profile.videoBitrate,
      playlistUrl: `${videoId}/${profile.name}.m3u8`,
    });
  }

  await generateMasterPlaylist(outputDir, profiles);

  const thumbDir = path.join(__dirname, '../../../uploads/thumbnails', videoId);
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
  const thumbPath = path.join(thumbDir, 'auto.jpg');
  await extractThumbnail(inputPath, thumbPath).catch(() => {});

  return {
    masterPlaylist: `${videoId}/master.m3u8`,
    variants: completedProfiles,
    thumbnail: fs.existsSync(thumbPath) ? `thumbnails/${videoId}/auto.jpg` : null,
    metadata,
  };
};

module.exports = { getVideoMetadata, generateHLS, generateMasterPlaylist, extractThumbnail, runTranscodingPipeline, QUALITY_PROFILES };

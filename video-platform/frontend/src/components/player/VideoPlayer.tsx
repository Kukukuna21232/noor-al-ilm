'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles, SkipBack, SkipForward, Loader2, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface SubtitleTrack { language: string; label: string; file_url: string; }

interface VideoPlayerProps {
  manifestUrl: string;
  thumbnailUrl?: string;
  subtitles?: SubtitleTrack[];
  title?: string;
  autoPlay?: boolean;
  startPosition?: number;
  onProgress?: (position: number, percent: number) => void;
  onEnded?: () => void;
  isRTL?: boolean;
}

export default function VideoPlayer({ manifestUrl, thumbnailUrl, subtitles = [], title, autoPlay = false, startPosition = 0, onProgress, onEnded, isRTL = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<NodeJS.Timeout>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ name: string; index: number }[]>([]);
  const [quality, setQuality] = useState('auto');
  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [showQuality, setShowQuality] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifestUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1, maxBufferLength: 30 });
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualities(data.levels.map((l, i) => ({ name: `${l.height}p`, index: i })));
        setIsLoading(false);
        if (autoPlay) video.play().catch(() => {});
        if (startPosition > 0) video.currentTime = startPosition;
      });
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) { setError('فشل تحميل الفيديو'); setIsLoading(false); } });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
      video.addEventListener('loadedmetadata', () => { setIsLoading(false); if (autoPlay) video.play().catch(() => {}); });
    }
    return () => { hlsRef.current?.destroy(); };
  }, [manifestUrl]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const on = (e: string, fn: () => void) => v.addEventListener(e, fn);
    on('play', () => setIsPlaying(true));
    on('pause', () => setIsPlaying(false));
    on('ended', () => { setIsPlaying(false); onEnded?.(); });
    on('timeupdate', () => { setCurrentTime(v.currentTime); onProgress?.(Math.round(v.currentTime), duration > 0 ? Math.round((v.currentTime / duration) * 100) : 0); });
    on('durationchange', () => setDuration(v.duration));
    on('waiting', () => setIsLoading(true));
    on('canplay', () => setIsLoading(false));
    on('progress', () => { if (v.buffered.length > 0) setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100); });
    on('volumechange', () => { setVolume(v.volume); setIsMuted(v.muted); });
  }, [duration, onProgress, onEnded]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [isPlaying]);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; isPlaying ? v.pause() : v.play(); };
  const toggleMute = () => { if (videoRef.current) videoRef.current.muted = !isMuted; };
  const skip = (s: number) => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + s)); };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) videoRef.current.currentTime = pct * duration;
  };

  const setQualityLevel = (name: string, index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setQuality(name); setShowQuality(false);
  };

  const setSubtitleTrack = (lang: string) => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach(t => { t.mode = 'disabled'; });
    if (lang !== 'off') { const t = Array.from(v.textTracks).find(t => t.language === lang); if (t) t.mode = 'showing'; }
    setActiveSubtitle(lang); setShowSubtitle(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef}
      className={clsx('relative bg-black overflow-hidden group select-none', isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video w-full rounded-2xl')}
      onMouseMove={resetHideTimer} onMouseLeave={() => isPlaying && setShowControls(false)} onClick={togglePlay}>
      <video ref={videoRef} className="w-full h-full object-contain" poster={thumbnailUrl} playsInline crossOrigin="anonymous">
        {subtitles.map(s => <track key={s.language} kind="subtitles" src={s.file_url} srcLang={s.language} label={s.label} />)}
      </video>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white"><p className="text-lg font-bold mb-2">⚠️ خطأ في التشغيل</p><p className="text-sm text-gray-400">{error}</p></div>
        </div>
      )}

      <AnimatePresence>
        {!isPlaying && !isLoading && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-end" onClick={e => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            {title && <div className="absolute top-4 left-4 right-4"><p className="text-white text-sm font-medium truncate drop-shadow-lg">{title}</p></div>}

            <div className="relative z-10 px-4 pb-4 space-y-2">
              {/* Progress */}
              <div className="relative group/p cursor-pointer" onClick={handleSeek}>
                <div className="h-1 group-hover/p:h-2 bg-white/30 rounded-full transition-all overflow-hidden">
                  <div className="absolute h-full bg-white/40 rounded-full" style={{ width: `${buffered}%` }} />
                  <div className="absolute h-full bg-gradient-to-r from-islamic-green to-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/p:opacity-100 transition-opacity" style={{ left: `calc(${pct}% - 6px)` }} />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="p-2 text-white hover:text-primary-400 transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
                  </button>
                  <button onClick={() => skip(-10)} className="p-1.5 text-white/80 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                  <button onClick={() => skip(10)} className="p-1.5 text-white/80 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
                  <div className="flex items-center gap-1 group/vol">
                    <button onClick={toggleMute} className="p-1.5 text-white/80 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-300">
                      <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                        onChange={e => { if (videoRef.current) { videoRef.current.volume = parseFloat(e.target.value); videoRef.current.muted = parseFloat(e.target.value) === 0; } }}
                        className="w-20 h-1 accent-primary-500 cursor-pointer" />
                    </div>
                  </div>
                  <span className="text-white text-xs font-mono">{fmt(currentTime)} / {fmt(duration)}</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Speed */}
                  <div className="relative">
                    <button onClick={() => { setShowSpeed(!showSpeed); setShowQuality(false); setShowSubtitle(false); }}
                      className="p-1.5 text-white/80 hover:text-white text-xs font-bold">{playbackRate}x</button>
                    {showSpeed && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-xl p-2 min-w-[90px]">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                          <button key={r} onClick={() => { if (videoRef.current) videoRef.current.playbackRate = r; setPlaybackRate(r); setShowSpeed(false); }}
                            className={clsx('flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-lg hover:bg-white/10', r === playbackRate ? 'text-primary-400' : 'text-white')}>
                            {r}x {r === playbackRate && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality */}
                  {qualities.length > 0 && (
                    <div className="relative">
                      <button onClick={() => { setShowQuality(!showQuality); setShowSubtitle(false); setShowSpeed(false); }}
                        className="p-1.5 text-white/80 hover:text-white"><Settings className="w-4 h-4" /></button>
                      {showQuality && (
                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-xl p-2 min-w-[110px]">
                          <p className="text-gray-400 text-xs px-3 py-1">الجودة</p>
                          {[{ name: 'auto', index: -1 }, ...qualities].map(q => (
                            <button key={q.name} onClick={() => setQualityLevel(q.name, q.index)}
                              className={clsx('flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-lg hover:bg-white/10', quality === q.name ? 'text-primary-400' : 'text-white')}>
                              {q.name === 'auto' ? 'تلقائي' : q.name} {quality === q.name && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subtitles */}
                  {subtitles.length > 0 && (
                    <div className="relative">
                      <button onClick={() => { setShowSubtitle(!showSubtitle); setShowQuality(false); setShowSpeed(false); }}
                        className={clsx('p-1.5 transition-colors', activeSubtitle !== 'off' ? 'text-primary-400' : 'text-white/80 hover:text-white')}>
                        <Subtitles className="w-4 h-4" />
                      </button>
                      {showSubtitle && (
                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-xl p-2 min-w-[130px]">
                          <p className="text-gray-400 text-xs px-3 py-1">الترجمة</p>
                          {[{ language: 'off', label: 'إيقاف', file_url: '' }, ...subtitles].map(s => (
                            <button key={s.language} onClick={() => setSubtitleTrack(s.language)}
                              className={clsx('flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-lg hover:bg-white/10', activeSubtitle === s.language ? 'text-primary-400' : 'text-white')}>
                              {s.label} {activeSubtitle === s.language && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={toggleFullscreen} className="p-1.5 text-white/80 hover:text-white transition-colors">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

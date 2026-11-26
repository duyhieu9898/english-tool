import { Router } from 'express';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const router = Router();
const DEFAULT_VOICE = 'en-US-AriaNeural';
const MAX_CACHE_SIZE = 200;
const audioCache = new Map();

const setCachedAudio = (key, buffer) => {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }
  audioCache.set(key, buffer);
};

router.get('/', async (req, res) => {
  const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'Missing text query parameter' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long (max 500 characters)' });
  }

  const parsedRate = Number(req.query.rate);
  const rate = Number.isFinite(parsedRate) ? Math.min(1.5, Math.max(0.5, parsedRate)) : 0.9;
  const cacheKey = `${DEFAULT_VOICE}:${rate}:${text}`;

  const cached = audioCache.get(cacheKey);
  if (cached) {
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    });
    return res.send(cached);
  }

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(DEFAULT_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate });
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    setCachedAudio(cacheKey, buffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    });
    return res.send(buffer);
  } catch (err) {
    console.error('[tts] Failed to synthesize audio:', err.message);
    return res.status(502).json({ error: 'TTS synthesis failed' });
  } finally {
    tts.close();
  }
});

export default router;

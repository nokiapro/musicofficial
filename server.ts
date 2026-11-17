/// <reference types="node" />
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY || 'AIzaSyCELRyno2Oa7j-ZaPL9A-kRLnsqGv9bqbc';
const RTDB_URL =
  process.env.FIREBASE_DATABASE_URL ||
  'https://newmusic-5625b-default-rtdb.asia-southeast1.firebasedatabase.app';

const PRIMARY_ADMIN_EMAILS = [
  'admin@xuanken.vn',
  'phamthikimthanh.qy@gmail.com',
];

const DATA_DIR = path.resolve(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'api-keys.json');

interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  keyHash: string;
  keyPreview: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  usageCount: number;
}

interface RawSong {
  id?: string;
  stt?: number;
  title?: string;
  artists?: string;
  album?: string;
  duration?: number;
  coverGradient?: string;
  coverImage?: string;
  releaseDate?: string;
  composer?: string;
  genre?: string;
  provider?: string;
  plays?: string;
  playCount?: number;
  likesCount?: number;
  lyrics?: Array<{ time: number; text: string }>;
  lrcRaw?: string;
  lrcUrl?: string;
  audioFormat?: string;
  price?: number | string;
  demoUrl?: string;
  mp3Url?: string;
  wavUrl?: string;
  isAlbumTrack?: boolean;
  albumId?: string;
}

interface AuthenticatedApiRequest extends Request {
  apiKeyMeta?: {
    id: string;
    name: string;
    usageCount: number;
  };
  adminUser?: {
    uid: string;
    email: string;
  };
}

// =====================================================================
// API KEY STORAGE & HASH HELPERS
// =====================================================================
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function maskKey(rawKey: string): string {
  if (rawKey.length <= 12) {
    return `${rawKey.slice(0, 4)}••••${rawKey.slice(-2)}`;
  }
  return `${rawKey.slice(0, 10)}••••${rawKey.slice(-4)}`;
}

function generateApiKey(): string {
  return `xk_live_${crypto.randomBytes(18).toString('hex')}`;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalApiKeys(): ApiKeyRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(KEYS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(KEYS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[API Keys] Failed to read local keys file:', err);
    return [];
  }
}

function saveLocalApiKeys(keys: ApiKeyRecord[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[API Keys] Failed to write local keys file:', err);
  }
}

let apiKeysCache: ApiKeyRecord[] = loadLocalApiKeys();
let persistTimer: NodeJS.Timeout | null = null;

function scheduleKeysPersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    saveLocalApiKeys(apiKeysCache);
  }, 1500);
}

// Optional env-based keys (comma-separated) if configured by owner
function getEnvApiKeyHashes(): Map<string, ApiKeyRecord> {
  const map = new Map<string, ApiKeyRecord>();
  const raw = process.env.PUBLIC_API_KEYS || '';
  if (!raw.trim()) return map;
  raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .forEach((k, idx) => {
      const hash = sha256(k);
      map.set(hash, {
        id: `env-key-${idx + 1}`,
        name: `Environment Key #${idx + 1}`,
        key: k,
        keyHash: hash,
        keyPreview: maskKey(k),
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'env',
        lastUsedAt: null,
        usageCount: 0,
      });
    });
  return map;
}

// =====================================================================
// FIREBASE REST HELPERS
// =====================================================================
async function fetchRtdbJson<T = unknown>(
  nodePath: string,
  authToken?: string
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const cleanPath = nodePath.replace(/^\/+/, '');
    const query = authToken ? `?auth=${encodeURIComponent(authToken)}` : '';
    const res = await fetch(`${RTDB_URL}/${cleanPath}.json${query}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, data: null };
    }
    const data = (await res.json()) as T | null;
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.warn(`[RTDB] Failed to fetch ${nodePath}:`, err);
    return { ok: false, status: 500, data: null };
  }
}

async function writeRtdbJson(
  nodePath: string,
  payload: unknown,
  authToken: string,
  method: 'PUT' | 'PATCH' | 'DELETE' = 'PUT'
): Promise<boolean> {
  try {
    const cleanPath = nodePath.replace(/^\/+/, '');
    const url = `${RTDB_URL}/${cleanPath}.json?auth=${encodeURIComponent(authToken)}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[RTDB] Failed to ${method} ${nodePath}:`, err);
    return false;
  }
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string }>;
    };
    const user = json?.users?.[0];
    if (!user?.localId) return null;
    return {
      uid: user.localId,
      email: (user.email || '').toLowerCase().trim(),
    };
  } catch {
    return null;
  }
}

async function checkIsFirebaseAdmin(
  uid: string,
  email: string,
  idToken: string
): Promise<boolean> {
  if (PRIMARY_ADMIN_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase())) {
    return true;
  }
  const adminNode = await fetchRtdbJson<unknown>(`admins/${uid}`, idToken);
  if (adminNode.ok && adminNode.data) {
    return true;
  }
  const memberNode = await fetchRtdbJson<{ role?: string }>(`members/${uid}`, idToken);
  if (memberNode.ok && memberNode.data?.role === 'admin') {
    return true;
  }
  return false;
}

// =====================================================================
// CATALOG CACHE & PAID/FREE LINK SANITIZATION
// =====================================================================
const catalogCache = new Map<string, { expiresAt: number; data: unknown }>();

async function fetchCachedRtdb<T>(nodePath: string, ttlMs = 10000): Promise<T | null> {
  const now = Date.now();
  const hit = catalogCache.get(nodePath);
  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }
  const res = await fetchRtdbJson<T>(nodePath);
  if (res.ok && res.data !== null) {
    catalogCache.set(nodePath, { expiresAt: now + ttlMs, data: res.data });
    return res.data;
  }
  return hit ? (hit.data as T) : null;
}

function sanitizePublicSong(raw: RawSong, idFallback: string) {
  const price =
    typeof raw?.price === 'number' ? raw.price : Number(raw?.price) || 0;
  const isPaid = price > 0;

  // Paid songs: strictly hide mp3Url and wavUrl, only expose demoUrl (60s preview)
  // Free songs (price <= 0): expose full mp3Url, wavUrl, and demoUrl
  const demoUrl = raw?.demoUrl ? String(raw.demoUrl).trim() : null;
  const fullMp3 = !isPaid && raw?.mp3Url ? String(raw.mp3Url).trim() : null;
  const fullWav = !isPaid && raw?.wavUrl ? String(raw.wavUrl).trim() : null;
  const audioUrl = isPaid
    ? demoUrl
    : fullWav || fullMp3 || demoUrl || null;

  return {
    id: raw?.id || idFallback,
    stt: typeof raw?.stt === 'number' ? raw.stt : null,
    title: raw?.title || 'Bài Hát Chưa Đặt Tên',
    artists: raw?.artists || 'XuanKen',
    album: raw?.album || 'XuanKen Official',
    duration:
      typeof raw?.duration === 'number' && raw.duration > 0
        ? raw.duration
        : 210,
    coverImage: raw?.coverImage || null,
    coverGradient: raw?.coverGradient || 'from-purple-600 to-indigo-800',
    releaseDate: raw?.releaseDate || '2026',
    composer: raw?.composer || raw?.artists || 'XuanKen',
    genre: raw?.genre || 'Việt Nam, V-Pop',
    provider: raw?.provider || 'XuanKen Official',
    audioFormat: raw?.audioFormat === 'WAV' ? 'WAV' : 'MP3',
    price,
    isPaid,
    audioProtected: isPaid,
    availableStreamType: isPaid ? 'demo' : 'full',
    playCount: typeof raw?.playCount === 'number' ? raw.playCount : 0,
    likesCount:
      typeof raw?.likesCount === 'number'
        ? raw.likesCount
        : Number(raw?.likesCount) || 0,
    demoUrl,
    mp3Url: fullMp3,
    wavUrl: fullWav,
    audioUrl,
    lyrics: Array.isArray(raw?.lyrics) ? raw.lyrics : [],
    lrcRaw: raw?.lrcRaw || null,
  };
}

function sanitizePublicAlbumSong(raw: RawSong, albumId: string, albumArtist: string, albumCover: string, idx: number) {
  const price =
    typeof raw?.price === 'number' ? raw.price : Number(raw?.price) || 0;
  const isPaid = price > 0;

  const demoUrl = raw?.demoUrl ? String(raw.demoUrl).trim() : null;
  const fullMp3 = !isPaid && raw?.mp3Url ? String(raw.mp3Url).trim() : null;
  const fullWav = !isPaid && raw?.wavUrl ? String(raw.wavUrl).trim() : null;
  const audioUrl = isPaid
    ? demoUrl
    : fullWav || fullMp3 || demoUrl || null;

  return {
    id: raw?.id || `albsong-${albumId}-${idx + 1}`,
    albumId: raw?.albumId || albumId,
    stt: typeof raw?.stt === 'number' ? raw.stt : idx + 1,
    title: raw?.title || `Bài hát ${idx + 1}`,
    artists: raw?.artists || albumArtist,
    duration:
      typeof raw?.duration === 'number' && raw.duration > 0
        ? raw.duration
        : 210,
    audioFormat: raw?.audioFormat === 'WAV' ? 'WAV' : 'MP3',
    coverImage: raw?.coverImage || albumCover,
    price,
    isPaid,
    audioProtected: isPaid,
    availableStreamType: isPaid ? 'demo' : 'full',
    playCount: typeof raw?.playCount === 'number' ? raw.playCount : 0,
    demoUrl,
    mp3Url: fullMp3,
    wavUrl: fullWav,
    audioUrl,
    lyrics: Array.isArray(raw?.lyrics) ? raw.lyrics : [],
    lrcRaw: raw?.lrcRaw || null,
  };
}

async function getAllPublicSongs() {
  const raw = await fetchCachedRtdb<Record<string, RawSong> | RawSong[]>('songs');
  if (!raw) return [];
  const entries: Array<[string, RawSong]> = Array.isArray(raw)
    ? raw
        .map((s, idx): [string, RawSong] => [s?.id || `song-${idx + 1}`, s])
        .filter(([, s]) => Boolean(s))
    : Object.entries(raw);

  return entries
    .filter(([, val]) => val && (val.title || val.demoUrl || val.mp3Url || val.wavUrl))
    .map(([key, val]) => sanitizePublicSong(val, key))
    .sort((a, b) => (a.stt ?? 999999) - (b.stt ?? 999999));
}

async function getAllPublicAlbums() {
  const raw = await fetchCachedRtdb<Record<string, any> | any[]>('exclusive_albums');
  if (!raw) return [];
  const entries: Array<[string, any]> = Array.isArray(raw)
    ? raw.map((a, idx): [string, any] => [a?.id || `alb-${idx + 1}`, a]).filter(([, a]) => Boolean(a))
    : Object.entries(raw);

  return entries
    .filter(([, val]) => Boolean(val))
    .map(([key, val]) => {
      const albumId = val?.id || key;
      const albumArtist = val?.artist || 'XuanKen Official';
      const albumCover = val?.coverImage || '';
      const rawSongs: RawSong[] = Array.isArray(val?.songs)
        ? val.songs.filter(Boolean)
        : val?.songs && typeof val.songs === 'object'
        ? (Object.values(val.songs).filter(Boolean) as RawSong[])
        : [];
      const songs = rawSongs.map((s, idx) =>
        sanitizePublicAlbumSong(s, albumId, albumArtist, albumCover, idx)
      );
      return {
        id: albumId,
        title: val?.title || 'Album Mới',
        artist: albumArtist,
        coverImage: albumCover || null,
        description: val?.description || '',
        releaseYear: val?.releaseYear || null,
        genre: val?.genre || 'V-Pop / Ballad',
        trackCount: songs.length,
        songs,
        createdAt: val?.createdAt || null,
      };
    });
}

async function getAllPublicArtists() {
  const raw = await fetchCachedRtdb<Record<string, any> | any[]>('artist_bios');
  if (raw) {
    const list = Array.isArray(raw)
      ? raw.filter(Boolean)
      : Object.values(raw).filter(Boolean);
    if (list.length > 0) return list;
  }

  // Fallback: synthesize artist list from public songs if artist_bios node isn't populated or rules restrict direct RTDB read
  const songs = await getAllPublicSongs();
  const seen = new Map<string, { id: string; name: string; avatarUrl: string | null; songCount: number; genres: string[] }>();
  for (const s of songs) {
    const names = String(s.artists || 'XuanKen')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) {
      const slug = name.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/gi, '-');
      const existing = seen.get(name.toLowerCase());
      if (existing) {
        existing.songCount += 1;
      } else {
        seen.set(name.toLowerCase(), {
          id: `artist-${slug}`,
          name,
          avatarUrl: s.coverImage,
          songCount: 1,
          genres: s.genre ? [s.genre] : [],
        });
      }
    }
  }
  return Array.from(seen.values());
}

// =====================================================================
// MIDDLEWARE: CORS, API KEY AUTH, ADMIN AUTH
// =====================================================================
function apiCorsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

function extractApiKeyFromRequest(req: Request): string {
  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const queryKey = req.query.apiKey || req.query.api_key || req.query.key;
  if (typeof queryKey === 'string' && queryKey.trim()) {
    return queryKey.trim();
  }
  return '';
}

async function requireApiKey(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const providedKey = extractApiKeyFromRequest(req);
  if (!providedKey) {
    res.status(401).json({
      success: false,
      code: 'API_KEY_REQUIRED',
      error:
        'Thiếu API Key. Vui lòng truyền key của bạn qua header "x-api-key", "Authorization: Bearer <key>" hoặc query "?apiKey=<key>".',
    });
    return;
  }

  const incomingHash = sha256(providedKey);

  // 1. Check local cache / file store
  let matched = apiKeysCache.find((k) => k.keyHash === incomingHash);

  // 2. Check optional env keys
  if (!matched) {
    const envMap = getEnvApiKeyHashes();
    matched = envMap.get(incomingHash);
  }

  // 3. Fallback: check Firebase RTDB hash registry (supports cold container restarts)
  if (!matched) {
    const remoteHash = await fetchRtdbJson<{
      id?: string;
      name?: string;
      isActive?: boolean;
      createdAt?: string;
      createdBy?: string;
    }>(`api_key_hashes/${incomingHash}`);
    if (remoteHash.ok && remoteHash.data) {
      matched = {
        id: remoteHash.data.id || incomingHash.slice(0, 12),
        name: remoteHash.data.name || 'API Key',
        key: providedKey,
        keyHash: incomingHash,
        keyPreview: maskKey(providedKey),
        isActive: remoteHash.data.isActive !== false,
        createdAt: remoteHash.data.createdAt || new Date().toISOString(),
        createdBy: remoteHash.data.createdBy || 'admin',
        lastUsedAt: null,
        usageCount: 0,
      };
      apiKeysCache.push(matched);
      scheduleKeysPersist();
    }
  }

  if (!matched) {
    res.status(403).json({
      success: false,
      code: 'API_KEY_INVALID',
      error: 'API Key không hợp lệ hoặc chưa được tạo bởi Admin.',
    });
    return;
  }

  if (!matched.isActive) {
    res.status(403).json({
      success: false,
      code: 'API_KEY_DISABLED',
      error: 'API Key này đang bị tạm khóa. Vui lòng bật lại trong trang Admin.',
    });
    return;
  }

  matched.usageCount = (matched.usageCount || 0) + 1;
  matched.lastUsedAt = new Date().toISOString();
  scheduleKeysPersist();

  req.apiKeyMeta = {
    id: matched.id,
    name: matched.name,
    usageCount: matched.usageCount,
  };
  next();
}

async function requireAdminAuth(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const idToken =
    typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';

  if (!idToken) {
    res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập tài khoản Admin để quản lý API Key.',
    });
    return;
  }

  const verifiedUser = await verifyFirebaseIdToken(idToken);
  if (!verifiedUser) {
    res.status(401).json({
      success: false,
      error: 'Phiên đăng nhập Firebase không hợp lệ hoặc đã hết hạn.',
    });
    return;
  }

  const isAdmin = await checkIsFirebaseAdmin(
    verifiedUser.uid,
    verifiedUser.email,
    idToken
  );
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Chỉ Admin mới có quyền tạo và quản lý API Key.',
    });
    return;
  }

  req.adminUser = verifiedUser;
  next();
}

// =====================================================================
// SERVER BOOTSTRAP
// =====================================================================
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Apply CORS to all /api routes
  app.use('/api', apiCorsMiddleware);

  // -----------------------------------------------------------------
  // ADMIN API KEY MANAGEMENT ENDPOINTS (Protected by Firebase Admin Token)
  // -----------------------------------------------------------------
  app.get('/api/admin/keys', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    const authHeader = req.headers['authorization'] as string;
    const idToken = authHeader.slice(7).trim();

    // Try merging keys from Firebase RTDB in case container restarted
    const remoteKeys = await fetchRtdbJson<Record<string, ApiKeyRecord>>('api_keys', idToken);
    let cloudAvailable = remoteKeys.ok;
    if (remoteKeys.ok && remoteKeys.data && typeof remoteKeys.data === 'object') {
      let changed = false;
      for (const remoteRecord of Object.values(remoteKeys.data)) {
        if (remoteRecord && remoteRecord.id && remoteRecord.keyHash) {
          const localIdx = apiKeysCache.findIndex((k) => k.id === remoteRecord.id);
          if (localIdx === -1) {
            apiKeysCache.push({
              ...remoteRecord,
              usageCount: remoteRecord.usageCount || 0,
              lastUsedAt: remoteRecord.lastUsedAt || null,
            });
            changed = true;
          }
        }
      }
      if (changed) {
        saveLocalApiKeys(apiKeysCache);
      }
    }

    const sorted = [...apiKeysCache].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      success: true,
      cloudSynced: cloudAvailable,
      keys: sorted,
    });
  });

  app.post('/api/admin/keys', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    const authHeader = req.headers['authorization'] as string;
    const idToken = authHeader.slice(7).trim();

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const customKey =
      typeof req.body?.customKey === 'string' ? req.body.customKey.trim() : '';

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Vui lòng nhập tên gợi nhớ cho API Key (ví dụ: App Mobile, Web Đối Tác).',
      });
      return;
    }

    let finalKey = customKey;
    if (finalKey) {
      if (finalKey.length < 8 || finalKey.length > 128) {
        res.status(400).json({
          success: false,
          error: 'API Key tự nhập phải dài từ 8 đến 128 ký tự.',
        });
        return;
      }
      if (!/^[a-zA-Z0-9_\-.]+$/.test(finalKey)) {
        res.status(400).json({
          success: false,
          error: 'API Key chỉ được chứa chữ cái, số, dấu gạch dưới (_), gạch ngang (-) hoặc dấu chấm (.).',
        });
        return;
      }
    } else {
      finalKey = generateApiKey();
    }

    const keyHash = sha256(finalKey);
    if (apiKeysCache.some((k) => k.keyHash === keyHash)) {
      res.status(409).json({
        success: false,
        error: 'API Key này đã tồn tại. Vui lòng chọn key khác.',
      });
      return;
    }

    const record: ApiKeyRecord = {
      id: `key_${crypto.randomBytes(6).toString('hex')}`,
      name,
      key: finalKey,
      keyHash,
      keyPreview: maskKey(finalKey),
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.adminUser?.email || 'admin',
      lastUsedAt: null,
      usageCount: 0,
    };

    apiKeysCache.unshift(record);
    saveLocalApiKeys(apiKeysCache);

    // Best-effort cloud sync to Firebase RTDB
    const syncedMain = await writeRtdbJson(`api_keys/${record.id}`, record, idToken, 'PUT');
    const syncedHash = await writeRtdbJson(
      `api_key_hashes/${record.keyHash}`,
      {
        id: record.id,
        name: record.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        createdBy: record.createdBy,
      },
      idToken,
      'PUT'
    );

    res.status(201).json({
      success: true,
      cloudSynced: syncedMain && syncedHash,
      key: record,
    });
  });

  app.patch('/api/admin/keys/:id', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    const authHeader = req.headers['authorization'] as string;
    const idToken = authHeader.slice(7).trim();
    const { id } = req.params;

    const target = apiKeysCache.find((k) => k.id === id);
    if (!target) {
      res.status(404).json({ success: false, error: 'Không tìm thấy API Key.' });
      return;
    }

    if (typeof req.body?.isActive === 'boolean') {
      target.isActive = req.body.isActive;
    }
    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      target.name = req.body.name.trim();
    }

    saveLocalApiKeys(apiKeysCache);

    const syncedMain = await writeRtdbJson(`api_keys/${target.id}`, target, idToken, 'PUT');
    const syncedHash = await writeRtdbJson(
      `api_key_hashes/${target.keyHash}`,
      {
        id: target.id,
        name: target.name,
        isActive: target.isActive,
        createdAt: target.createdAt,
        createdBy: target.createdBy,
      },
      idToken,
      'PUT'
    );

    res.json({
      success: true,
      cloudSynced: syncedMain && syncedHash,
      key: target,
    });
  });

  app.delete('/api/admin/keys/:id', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    const authHeader = req.headers['authorization'] as string;
    const idToken = authHeader.slice(7).trim();
    const { id } = req.params;

    const idx = apiKeysCache.findIndex((k) => k.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Không tìm thấy API Key.' });
      return;
    }

    const [removed] = apiKeysCache.splice(idx, 1);
    saveLocalApiKeys(apiKeysCache);

    await writeRtdbJson(`api_keys/${removed.id}`, null, idToken, 'DELETE');
    await writeRtdbJson(`api_key_hashes/${removed.keyHash}`, null, idToken, 'DELETE');

    res.json({
      success: true,
      deletedId: removed.id,
    });
  });

  // -----------------------------------------------------------------
  // PUBLIC MUSIC API ROUTER (STRICTLY PROTECTED BY ADMIN API KEY)
  // -----------------------------------------------------------------
  const publicRouter = express.Router();
  publicRouter.use(requireApiKey);

  publicRouter.get(['/', '/info'], (req: AuthenticatedApiRequest, res: Response) => {
    res.json({
      success: true,
      service: 'XuanKen Music Public API',
      version: '1.0.0',
      authenticatedAs: req.apiKeyMeta,
      rules: {
        paidSongs: 'Ẩn hoàn toàn link full (mp3Url/wavUrl = null), chỉ trả về demoUrl (nếu có).',
        freeSongs: 'Trả về đầy đủ link nhạc (mp3Url, wavUrl, demoUrl).',
      },
      endpoints: [
        'GET /api/v1/songs',
        'GET /api/v1/songs/:id',
        'GET /api/v1/albums',
        'GET /api/v1/albums/:id',
        'GET /api/v1/artists',
        'GET /api/v1/artists/:id',
        'GET /api/v1/charts',
        'GET /api/v1/playlists',
        'GET /api/v1/site',
      ],
    });
  });

  publicRouter.get('/songs', async (req: Request, res: Response) => {
    try {
      let songs = await getAllPublicSongs();

      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const genre = typeof req.query.genre === 'string' ? req.query.genre.trim().toLowerCase() : '';
      const artist = typeof req.query.artist === 'string' ? req.query.artist.trim().toLowerCase() : '';
      const paidFilter = typeof req.query.paid === 'string' ? req.query.paid.trim().toLowerCase() : '';
      const sort = typeof req.query.sort === 'string' ? req.query.sort.trim().toLowerCase() : 'stt';

      if (q) {
        songs = songs.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artists.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q) ||
            s.composer.toLowerCase().includes(q)
        );
      }
      if (genre) {
        songs = songs.filter((s) => s.genre.toLowerCase().includes(genre));
      }
      if (artist) {
        songs = songs.filter((s) => s.artists.toLowerCase().includes(artist));
      }
      if (paidFilter === 'true' || paidFilter === '1') {
        songs = songs.filter((s) => s.isPaid);
      } else if (paidFilter === 'false' || paidFilter === '0') {
        songs = songs.filter((s) => !s.isPaid);
      }

      if (sort === 'popular' || sort === 'plays') {
        songs.sort((a, b) => b.playCount - a.playCount);
      } else if (sort === 'likes') {
        songs.sort((a, b) => b.likesCount - a.likesCount);
      } else if (sort === 'title') {
        songs.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      }

      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
      const total = songs.length;
      const start = (page - 1) * limit;
      const items = songs.slice(start, start + limit);

      res.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        data: items,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách bài hát' });
    }
  });

  publicRouter.get('/songs/:id', async (req: Request, res: Response) => {
    try {
      const songs = await getAllPublicSongs();
      const found = songs.find((s) => s.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }
      res.json({ success: true, data: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải chi tiết bài hát' });
    }
  });

  publicRouter.get('/albums', async (req: Request, res: Response) => {
    try {
      let albums = await getAllPublicAlbums();
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      if (q) {
        albums = albums.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.artist.toLowerCase().includes(q) ||
            a.genre.toLowerCase().includes(q)
        );
      }
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const total = albums.length;
      const items = albums.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        total,
        page,
        limit,
        data: items,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách album' });
    }
  });

  publicRouter.get('/albums/:id', async (req: Request, res: Response) => {
    try {
      const albums = await getAllPublicAlbums();
      const found = albums.find((a) => a.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy album.' });
        return;
      }
      res.json({ success: true, data: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải chi tiết album' });
    }
  });

  publicRouter.get('/artists', async (req: Request, res: Response) => {
    try {
      let artists = await getAllPublicArtists();
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      if (q) {
        artists = artists.filter(
          (a: any) =>
            String(a?.name || '').toLowerCase().includes(q) ||
            String(a?.realName || '').toLowerCase().includes(q)
        );
      }
      res.json({
        success: true,
        total: artists.length,
        data: artists,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách nghệ sĩ' });
    }
  });

  publicRouter.get('/artists/:id', async (req: Request, res: Response) => {
    try {
      const artists = await getAllPublicArtists();
      const targetId = decodeURIComponent(req.params.id).toLowerCase();
      const artist = artists.find(
        (a: any) =>
          String(a?.id || '').toLowerCase() === targetId ||
          String(a?.name || '').toLowerCase() === targetId
      );
      if (!artist) {
        res.status(404).json({ success: false, error: 'Không tìm thấy nghệ sĩ.' });
        return;
      }
      const songs = await getAllPublicSongs();
      const artistNameLower = String((artist as any).name || '').toLowerCase();
      const artistSongs = songs.filter((s) =>
        s.artists
          .split(',')
          .map((n) => n.trim().toLowerCase())
          .includes(artistNameLower)
      );
      res.json({
        success: true,
        data: {
          ...artist,
          songs: artistSongs,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải thông tin nghệ sĩ' });
    }
  });

  publicRouter.get('/charts', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const songs = await getAllPublicSongs();
      const topAllTime = [...songs]
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);
      const weekly = await fetchCachedRtdb<Record<string, unknown>>('weekly_plays');

      res.json({
        success: true,
        data: {
          topSongs: topAllTime,
          weeklyPlays: weekly || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải bảng xếp hạng' });
    }
  });

  publicRouter.get('/playlists', async (_req: Request, res: Response) => {
    try {
      const raw = await fetchCachedRtdb<Record<string, any> | any[]>('playlists');
      const list = raw
        ? Array.isArray(raw)
          ? raw.filter(Boolean)
          : Object.values(raw).filter(Boolean)
        : [];
      res.json({
        success: true,
        total: list.length,
        data: list,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách playlist' });
    }
  });

  publicRouter.get('/site', async (_req: Request, res: Response) => {
    try {
      const settings = await fetchCachedRtdb<Record<string, unknown>>('site_settings');
      res.json({
        success: true,
        data: settings || {
          siteName: 'XuanKen Music',
          siteSlogan: 'Nghe & Mua Nhạc Bản Quyền',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải thông tin trang web' });
    }
  });

  // Mount public router on both /api/v1 and /api (while /api/admin/* is already registered above)
  app.use('/api/v1', publicRouter);
  app.use('/api', publicRouter);

  // Unknown /api/* routes return JSON 404 instead of SPA HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint không tồn tại.',
    });
  });

  // -----------------------------------------------------------------
  // FRONTEND: VITE MIDDLEWARE IN DEV / STATIC DIST IN PROD
  // -----------------------------------------------------------------
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

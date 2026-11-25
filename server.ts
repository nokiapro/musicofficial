/// <reference types="node" />
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

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
  mp3_128Url?: string;
  mp3Url?: string;
  wavUrl?: string;
  isAlbumTrack?: boolean;
  albumId?: string;
}

interface MemberRecord {
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  balance?: number;
  purchasedSongIds?: string[];
  likedSongIds?: string[];
  likedAlbumIds?: string[];
  blockedSongIds?: string[];
  usedVoucherCodes?: string[];
  theme?: string;
  crossfadeDuration?: number;
  preferredAudioFormat?: 'MP3' | 'WAV';
  role?: 'admin' | 'user';
  createdAt?: string;
}

interface SongMasterRecord {
  id?: string;
  price?: number;
  mp3Url?: string;
  wavUrl?: string;
  updatedAt?: string;
}

interface UserContext {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  isAdmin: boolean;
  balance: number;
  purchasedSongIds: string[];
  likedSongIds: string[];
  likedAlbumIds: string[];
  blockedSongIds: string[];
  usedVoucherCodes: string[];
  theme: string;
  crossfadeDuration: number;
  preferredAudioFormat: 'MP3' | 'WAV';
  member: MemberRecord | null;
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
  userContext?: UserContext;
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
// FIREBASE REST & IDENTITY TOOLKIT HELPERS
// =====================================================================
async function fetchRtdbJson<T = unknown>(
  nodePath: string,
  authToken?: string,
  extraParams?: Record<string, string>
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const cleanPath = nodePath.replace(/^\/+/, '');
    const params = new URLSearchParams();
    if (authToken) {
      params.set('auth', authToken);
    }
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    const url = `${RTDB_URL}/${cleanPath}.json${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, {
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
  authToken?: string,
  method: 'PUT' | 'PATCH' | 'DELETE' = 'PUT'
): Promise<boolean> {
  try {
    const cleanPath = nodePath.replace(/^\/+/, '');
    const query = authToken ? `?auth=${encodeURIComponent(authToken)}` : '';
    const url = `${RTDB_URL}/${cleanPath}.json${query}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[RTDB] ${method} ${nodePath} returned ${res.status}:`, errText);
    }
    return res.ok;
  } catch (err) {
    console.warn(`[RTDB] Failed to ${method} ${nodePath}:`, err);
    return false;
  }
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string; displayName?: string } | null> {
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
      users?: Array<{ localId?: string; email?: string; displayName?: string }>;
    };
    const user = json?.users?.[0];
    if (!user?.localId) return null;
    return {
      uid: user.localId,
      email: (user.email || '').toLowerCase().trim(),
      displayName: user.displayName || undefined,
    };
  } catch {
    return null;
  }
}

async function signInFirebaseEmail(email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const json = (await res.json()) as any;
  if (!res.ok) {
    const fbMsg = String(json?.error?.message || '');
    let error = 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
    if (fbMsg.includes('INVALID_LOGIN_CREDENTIALS') || fbMsg.includes('INVALID_PASSWORD') || fbMsg.includes('EMAIL_NOT_FOUND')) {
      error = 'Email hoặc mật khẩu không chính xác.';
    } else if (fbMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
      error = 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.';
    } else if (fbMsg.includes('USER_DISABLED')) {
      error = 'Tài khoản này đã bị vô hiệu hóa.';
    }
    return { ok: false as const, status: 401, error, code: fbMsg || 'AUTH_FAILED' };
  }
  return {
    ok: true as const,
    uid: String(json.localId),
    email: String(json.email || email).toLowerCase().trim(),
    displayName: String(json.displayName || ''),
    idToken: String(json.idToken),
    refreshToken: String(json.refreshToken),
    expiresIn: Number(json.expiresIn || 3600),
  };
}

async function refreshFirebaseToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );
  const json = (await res.json()) as any;
  if (!res.ok || !json?.id_token) {
    return {
      ok: false as const,
      status: 401,
      error: 'Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    };
  }
  return {
    ok: true as const,
    idToken: String(json.id_token),
    refreshToken: String(json.refresh_token || refreshToken),
    expiresIn: Number(json.expires_in || 3600),
    uid: String(json.user_id || ''),
  };
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

async function loadOrInitUserContext(
  uid: string,
  email: string,
  idToken: string,
  fallbackDisplayName?: string
): Promise<UserContext> {
  const [memberRes, entitlementsRes, adminNodeRes] = await Promise.all([
    fetchRtdbJson<MemberRecord>(`members/${uid}`, idToken),
    fetchRtdbJson<Record<string, any>>(`user_purchases/${uid}`, idToken),
    fetchRtdbJson<unknown>(`admins/${uid}`, idToken),
  ]);

  let member = memberRes.ok ? memberRes.data : null;
  const isPrimaryAdmin = PRIMARY_ADMIN_EMAILS.some(
    (e) => e.toLowerCase() === email.toLowerCase()
  );

  if (!member) {
    const siteSettings = await fetchCachedRtdb<{ defaultStartingBalance?: number }>('site_settings', 15000);
    const startingBalance =
      typeof siteSettings?.defaultStartingBalance === 'number'
        ? Math.min(500000, Math.max(0, siteSettings.defaultStartingBalance))
        : 500000;

    member = {
      uid,
      email,
      displayName: fallbackDisplayName || email.split('@')[0] || 'Thành Viên',
      balance: startingBalance,
      purchasedSongIds: [],
      likedSongIds: [],
      likedAlbumIds: [],
      blockedSongIds: [],
      usedVoucherCodes: [],
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    await writeRtdbJson(`members/${uid}`, member, idToken, 'PUT');
  }

  const isAdmin =
    isPrimaryAdmin ||
    Boolean(adminNodeRes.ok && adminNodeRes.data) ||
    member.role === 'admin';

  const memberPurchased = Array.isArray(member.purchasedSongIds)
    ? member.purchasedSongIds.filter((s): s is string => typeof s === 'string')
    : [];
  const entitlementPurchased =
    entitlementsRes.ok && entitlementsRes.data && typeof entitlementsRes.data === 'object'
      ? Object.keys(entitlementsRes.data).filter(Boolean)
      : [];
  const purchasedSongIds = Array.from(new Set([...memberPurchased, ...entitlementPurchased]));

  return {
    uid,
    email,
    displayName: member.displayName || fallbackDisplayName || email.split('@')[0] || 'Thành Viên',
    idToken,
    isAdmin,
    balance: typeof member.balance === 'number' ? member.balance : 0,
    purchasedSongIds,
    likedSongIds: Array.isArray(member.likedSongIds) ? member.likedSongIds : [],
    likedAlbumIds: Array.isArray(member.likedAlbumIds) ? member.likedAlbumIds : [],
    blockedSongIds: Array.isArray(member.blockedSongIds) ? member.blockedSongIds : [],
    usedVoucherCodes: Array.isArray(member.usedVoucherCodes) ? member.usedVoucherCodes : [],
    theme: typeof member.theme === 'string' && member.theme ? member.theme : 'purple',
    crossfadeDuration:
      typeof member.crossfadeDuration === 'number' ? member.crossfadeDuration : 3,
    preferredAudioFormat:
      member.preferredAudioFormat === 'WAV' ? 'WAV' : 'MP3',
    member,
  };
}

// =====================================================================
// SIGNED STREAMING PROXY & WEEK KEY HELPERS (ZINGMP3 / NCT STYLE)
// =====================================================================
type StreamQuality = 'demo' | '128' | '320' | 'wav';

interface StreamGrant {
  songId: string;
  quality: StreamQuality;
  url: string;
  title: string;
  artists: string;
  uid: string;
  expiresAt: number;
}

const STREAM_SIGNING_SECRET =
  process.env.STREAM_SIGNING_SECRET ||
  sha256(`${FIREBASE_API_KEY}:${RTDB_URL}:xuanken_stream_v1`);
const STREAM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const streamGrantCache = new Map<string, StreamGrant>();

function cleanupExpiredStreamGrants(): void {
  const now = Date.now();
  for (const [k, v] of streamGrantCache.entries()) {
    if (v.expiresAt <= now) {
      streamGrantCache.delete(k);
    }
  }
}

function signStreamPayload(
  songId: string,
  quality: StreamQuality,
  uid: string,
  grantId: string,
  exp: number
): string {
  return crypto
    .createHmac('sha256', STREAM_SIGNING_SECRET)
    .update(`${songId}:${quality}:${uid}:${grantId}:${exp}`)
    .digest('hex');
}

function verifyStreamSignature(
  songId: string,
  quality: StreamQuality,
  uid: string,
  grantId: string,
  exp: number,
  sig: string
): boolean {
  if (!sig || !Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = signStreamPayload(songId, quality, uid, grantId, exp);
  const a = Buffer.from(sig, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getRequestBaseUrl(req: Request): string {
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    typeof protoHeader === 'string' && protoHeader.trim()
      ? protoHeader.split(',')[0].trim()
      : req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function createSignedStreamUrl(
  req: Request,
  opts: {
    songId: string;
    quality: StreamQuality;
    targetUrl: string;
    title: string;
    artists: string;
    uid?: string;
    download?: boolean;
  }
): string {
  if (streamGrantCache.size > 2000) {
    cleanupExpiredStreamGrants();
  }
  const grantId = crypto.randomBytes(10).toString('hex');
  const exp = Date.now() + STREAM_TTL_MS;
  const uid = opts.uid || 'guest';
  streamGrantCache.set(grantId, {
    songId: opts.songId,
    quality: opts.quality,
    url: opts.targetUrl,
    title: opts.title,
    artists: opts.artists,
    uid,
    expiresAt: exp,
  });
  const sig = signStreamPayload(opts.songId, opts.quality, uid, grantId, exp);
  const baseUrl = getRequestBaseUrl(req);
  const dlParam = opts.download ? '&download=1' : '';
  return `${baseUrl}/api/v1/stream/${encodeURIComponent(opts.songId)}?q=${opts.quality}&uid=${encodeURIComponent(uid)}&g=${grantId}&exp=${exp}&sig=${sig}${dlParam}`;
}

function buildStreamUrlsForSong(
  req: Request,
  song: ReturnType<typeof sanitizeSongForUser>,
  uid?: string
) {
  const urls: {
    demo: string | null;
    mp3_128: string | null;
    mp3_320: string | null;
    wav: string | null;
    default: string | null;
  } = {
    demo: song.demoUrl
      ? createSignedStreamUrl(req, {
          songId: song.id,
          quality: 'demo',
          targetUrl: song.demoUrl,
          title: song.title,
          artists: song.artists,
          uid,
        })
      : null,
    mp3_128: song.mp3_128Url
      ? createSignedStreamUrl(req, {
          songId: song.id,
          quality: '128',
          targetUrl: song.mp3_128Url,
          title: song.title,
          artists: song.artists,
          uid,
        })
      : null,
    mp3_320:
      song.hasFullAccess && song.mp3Url
        ? createSignedStreamUrl(req, {
            songId: song.id,
            quality: '320',
            targetUrl: song.mp3Url,
            title: song.title,
            artists: song.artists,
            uid,
          })
        : null,
    wav:
      song.hasFullAccess && song.wavUrl
        ? createSignedStreamUrl(req, {
            songId: song.id,
            quality: 'wav',
            targetUrl: song.wavUrl,
            title: song.title,
            artists: song.artists,
            uid,
          })
        : null,
    default: null,
  };
  urls.default = song.hasFullAccess
    ? urls.mp3_320 || urls.wav || urls.mp3_128 || urls.demo
    : urls.demo || urls.mp3_128;
  return urls;
}

function getCurrentWeekKey(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

function toCompactSong(
  song: ReturnType<typeof sanitizeSongForUser>,
  includeLinks = false
) {
  return {
    id: song.id,
    stt: song.stt,
    title: song.title,
    artists: song.artists,
    album: song.album,
    duration: song.duration,
    coverImage: song.coverImage,
    coverGradient: song.coverGradient,
    releaseDate: song.releaseDate,
    composer: song.composer,
    genre: song.genre,
    provider: song.provider,
    audioFormat: song.audioFormat,
    price: song.price,
    isPaid: song.isPaid,
    isPurchased: song.isPurchased,
    hasFullAccess: song.hasFullAccess,
    audioProtected: song.audioProtected,
    availableStreamType: song.availableStreamType,
    playCount: song.playCount,
    likesCount: song.likesCount,
    hasLyrics: Array.isArray(song.lyrics) && song.lyrics.length > 0,
    demoUrl: song.demoUrl,
    mp3_128Url: song.mp3_128Url,
    ...(includeLinks
      ? {
          mp3Url: song.mp3Url,
          wavUrl: song.wavUrl,
          audioUrl: song.audioUrl,
        }
      : {}),
    streamEndpoint: `/api/v1/songs/${song.id}/stream`,
  };
}

// =====================================================================
// CATALOG CACHE & PERSONALIZED SONG / ALBUM SANITIZATION
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

function sanitizeSongForUser(
  raw: RawSong,
  idFallback: string,
  userCtx?: UserContext,
  masterRecord?: SongMasterRecord | null
) {
  const id = raw?.id || idFallback;
  const price =
    typeof raw?.price === 'number' ? raw.price : Number(raw?.price) || 0;
  const isPaid = price > 0;
  const isUserBuyer = Boolean(userCtx?.purchasedSongIds.includes(id));
  const hasFullAccess = !isPaid || Boolean(userCtx?.isAdmin) || isUserBuyer;

  const demoUrl = raw?.demoUrl ? String(raw.demoUrl).trim() : null;
  const mp3_128Url = raw?.mp3_128Url ? String(raw.mp3_128Url).trim() : null;

  // Protected 320kbps MP3 & WAV Lossless ONLY exposed when free OR user owns / admin
  const rawFullMp3 = masterRecord?.mp3Url || raw?.mp3Url || '';
  const rawFullWav = masterRecord?.wavUrl || raw?.wavUrl || '';
  const fullMp3 = hasFullAccess && rawFullMp3 ? String(rawFullMp3).trim() : null;
  const fullWav = hasFullAccess && rawFullWav ? String(rawFullWav).trim() : null;

  const audioUrl = hasFullAccess
    ? fullWav || fullMp3 || mp3_128Url || demoUrl || null
    : demoUrl || mp3_128Url || null;

  const availableStreamType = hasFullAccess
    ? 'full'
    : mp3_128Url
    ? '128kbps'
    : 'demo';

  return {
    id,
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
    isPurchased: !isPaid || isUserBuyer || Boolean(userCtx?.isAdmin),
    hasFullAccess,
    audioProtected: !hasFullAccess,
    availableStreamType,
    playCount: typeof raw?.playCount === 'number' ? raw.playCount : 0,
    likesCount:
      typeof raw?.likesCount === 'number'
        ? raw.likesCount
        : Number(raw?.likesCount) || 0,
    demoUrl,
    mp3_128Url,
    mp3Url: fullMp3,
    wavUrl: fullWav,
    audioUrl,
    lyrics: Array.isArray(raw?.lyrics) ? raw.lyrics : [],
    lrcRaw: raw?.lrcRaw || null,
  };
}

function sanitizeAlbumSongForUser(
  raw: RawSong,
  albumId: string,
  albumArtist: string,
  albumCover: string,
  idx: number,
  userCtx?: UserContext
) {
  const id = raw?.id || `albsong-${albumId}-${idx + 1}`;
  const price =
    typeof raw?.price === 'number' ? raw.price : Number(raw?.price) || 0;
  const isPaid = price > 0;
  const isUserBuyer = Boolean(userCtx?.purchasedSongIds.includes(id));
  const hasFullAccess = !isPaid || Boolean(userCtx?.isAdmin) || isUserBuyer;

  const demoUrl = raw?.demoUrl ? String(raw.demoUrl).trim() : null;
  const mp3_128Url = raw?.mp3_128Url ? String(raw.mp3_128Url).trim() : null;
  const fullMp3 = hasFullAccess && raw?.mp3Url ? String(raw.mp3Url).trim() : null;
  const fullWav = hasFullAccess && raw?.wavUrl ? String(raw.wavUrl).trim() : null;
  const audioUrl = hasFullAccess
    ? fullWav || fullMp3 || mp3_128Url || demoUrl || null
    : demoUrl || mp3_128Url || null;

  return {
    id,
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
    isPurchased: hasFullAccess,
    hasFullAccess,
    audioProtected: !hasFullAccess,
    availableStreamType: hasFullAccess ? 'full' : mp3_128Url ? '128kbps' : 'demo',
    playCount: typeof raw?.playCount === 'number' ? raw.playCount : 0,
    demoUrl,
    mp3_128Url,
    mp3Url: fullMp3,
    wavUrl: fullWav,
    audioUrl,
    lyrics: Array.isArray(raw?.lyrics) ? raw.lyrics : [],
    lrcRaw: raw?.lrcRaw || null,
  };
}

async function fetchAuthorizedMastersMap(
  entries: Array<[string, RawSong]>,
  userCtx?: UserContext
): Promise<Map<string, SongMasterRecord>> {
  const mastersMap = new Map<string, SongMasterRecord>();

  if (userCtx?.isAdmin) {
    const allMasters = await fetchRtdbJson<Record<string, SongMasterRecord>>(
      'song_masters',
      userCtx.idToken
    );
    if (allMasters.ok && allMasters.data && typeof allMasters.data === 'object') {
      for (const [id, rec] of Object.entries(allMasters.data)) {
        if (rec) mastersMap.set(id, rec);
      }
      return mastersMap;
    }
  }

  // Only fetch protected masters for songs the user is legitimately allowed to access
  const authorizedIds = entries
    .filter(([key, val]) => {
      const id = val?.id || key;
      const price = typeof val?.price === 'number' ? val.price : Number(val?.price) || 0;
      if (price <= 0) return Boolean(userCtx);
      return Boolean(userCtx && userCtx.purchasedSongIds.includes(id));
    })
    .map(([key, val]) => val?.id || key);

  if (authorizedIds.length > 0 && userCtx) {
    const results = await Promise.all(
      authorizedIds.map(async (songId) => {
        const res = await fetchRtdbJson<SongMasterRecord>(
          `song_masters/${songId}`,
          userCtx.idToken
        );
        return [songId, res.ok ? res.data : null] as const;
      })
    );
    for (const [songId, rec] of results) {
      if (rec) mastersMap.set(songId, rec);
    }
  }

  return mastersMap;
}

async function getAllSongsForUser(userCtx?: UserContext) {
  const raw = await fetchCachedRtdb<Record<string, RawSong> | RawSong[]>('songs');
  if (!raw) return [];
  const entries: Array<[string, RawSong]> = (
    Array.isArray(raw)
      ? raw
          .map((s, idx): [string, RawSong] => [s?.id || `song-${idx + 1}`, s])
          .filter(([, s]) => Boolean(s))
      : Object.entries(raw)
  ).filter(
    ([, val]) =>
      val && (val.title || val.demoUrl || val.mp3_128Url || val.mp3Url || val.wavUrl)
  );

  const mastersMap = await fetchAuthorizedMastersMap(entries, userCtx);

  return entries
    .map(([key, val]) => {
      const id = val?.id || key;
      return sanitizeSongForUser(val, key, userCtx, mastersMap.get(id) || null);
    })
    .sort((a, b) => (a.stt ?? 999999) - (b.stt ?? 999999));
}

async function getAllAlbumsForUser(userCtx?: UserContext) {
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
        sanitizeAlbumSongForUser(s, albumId, albumArtist, albumCover, idx, userCtx)
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
  const songs = await getAllSongsForUser();
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
// MIDDLEWARE: CORS, API KEY AUTH, USER TOKEN SYNC, ADMIN AUTH
// =====================================================================
function apiCorsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, x-user-token, Accept, Origin, Range, X-Requested-With, Cache-Control'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Range, Accept-Ranges, Content-Length, Content-Disposition'
  );
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
  const queryKey = req.query.apiKey || req.query.api_key || req.query.key;
  if (typeof queryKey === 'string' && queryKey.trim()) {
    return queryKey.trim();
  }
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  return '';
}

function extractUserTokenFromRequest(req: Request): string {
  const userHeader = req.headers['x-user-token'];
  if (typeof userHeader === 'string' && userHeader.trim()) {
    return userHeader.trim();
  }
  const queryToken = req.query.userToken || req.query.user_token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }
  // Allow Authorization: Bearer <firebase_id_token> when x-api-key or ?apiKey is also provided
  const hasSeparateApiKey = Boolean(
    (typeof req.headers['x-api-key'] === 'string' && req.headers['x-api-key'].trim()) ||
      req.query.apiKey ||
      req.query.api_key ||
      req.query.key
  );
  if (hasSeparateApiKey) {
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) return token;
    }
  }
  return '';
}

async function resolveOptionalUserContext(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userToken = extractUserTokenFromRequest(req);
    if (!userToken) {
      req.userContext = undefined;
      next();
      return;
    }

    const verified = await verifyFirebaseIdToken(userToken);
    if (!verified) {
      res.status(401).json({
        success: false,
        code: 'USER_TOKEN_INVALID',
        error:
          'Token tài khoản người dùng (x-user-token) không hợp lệ hoặc đã hết hạn. Vui lòng gọi POST /api/v1/auth/refresh hoặc đăng nhập lại.',
      });
      return;
    }

    req.userContext = await loadOrInitUserContext(
      verified.uid,
      verified.email,
      userToken,
      verified.displayName
    );
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Lỗi xác thực tài khoản người dùng.',
    });
  }
}

function requireUserAuth(
  req: AuthenticatedApiRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userContext) {
    res.status(401).json({
      success: false,
      code: 'USER_AUTH_REQUIRED',
      error:
        'Endpoint này yêu cầu đăng nhập tài khoản người dùng. Hãy gọi POST /api/v1/auth/login để lấy idToken và gửi qua header "x-user-token" (hoặc "Authorization: Bearer <idToken>" kèm "x-api-key").',
    });
    return;
  }
  next();
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
  try {
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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Lỗi xác thực Admin.',
    });
  }
}

// =====================================================================
// SERVER BOOTSTRAP
// =====================================================================
async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  // Apply CORS to all /api routes
  app.use('/api', apiCorsMiddleware);

  // Public health check (no API key required) to verify server reachability
  app.get(['/api/health', '/api/v1/health'], (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'online',
      service: 'XuanKen Music API',
      timestamp: new Date().toISOString(),
    });
  });

  // -----------------------------------------------------------------
  // ADMIN API KEY MANAGEMENT ENDPOINTS (Protected by Firebase Admin Token)
  // -----------------------------------------------------------------
  app.get('/api/admin/keys', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const authHeader = req.headers['authorization'] as string;
      const idToken = authHeader.slice(7).trim();

      // Try merging keys from Firebase RTDB in case container restarted
      const remoteKeys = await fetchRtdbJson<Record<string, ApiKeyRecord>>('api_keys', idToken);
      const cloudAvailable = remoteKeys.ok;
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
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi tải danh sách API Key.',
      });
    }
  });

  app.post('/api/admin/keys', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
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
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi tạo API Key.',
      });
    }
  });

  app.patch('/api/admin/keys/:id', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const authHeader = req.headers['authorization'] as string;
      const idToken = authHeader.slice(7).trim();
      const { id } = req.params;

      let target = apiKeysCache.find((k) => k.id === id);
      if (!target) {
        const remote = await fetchRtdbJson<ApiKeyRecord>(`api_keys/${id}`, idToken);
        if (remote.ok && remote.data) {
          target = remote.data;
          apiKeysCache.push(target);
        }
      }
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
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi cập nhật API Key.',
      });
    }
  });

  app.delete('/api/admin/keys/:id', requireAdminAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const authHeader = req.headers['authorization'] as string;
      const idToken = authHeader.slice(7).trim();
      const { id } = req.params;

      const idx = apiKeysCache.findIndex((k) => k.id === id);
      let removed: ApiKeyRecord | null = null;
      if (idx !== -1) {
        [removed] = apiKeysCache.splice(idx, 1);
        saveLocalApiKeys(apiKeysCache);
      } else {
        const remote = await fetchRtdbJson<ApiKeyRecord>(`api_keys/${id}`, idToken);
        if (remote.ok && remote.data) {
          removed = remote.data;
        }
      }

      if (!removed) {
        res.status(404).json({ success: false, error: 'Không tìm thấy API Key.' });
        return;
      }

      await writeRtdbJson(`api_keys/${removed.id}`, null, idToken, 'DELETE');
      await writeRtdbJson(`api_key_hashes/${removed.keyHash}`, null, idToken, 'DELETE');

      res.json({
        success: true,
        deletedId: removed.id,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi xóa API Key.',
      });
    }
  });

  // -----------------------------------------------------------------
  // SIGNED AUDIO STREAM PROXY (SUPPORTS RANGE SEEKING FOR PLAYERS)
  // -----------------------------------------------------------------
  app.get(['/api/v1/stream/:id', '/api/stream/:id'], async (req: Request, res: Response) => {
    try {
      const songId = String(req.params.id || '').trim();
      const qualityRaw = String(req.query.q || 'demo').trim();
      const quality: StreamQuality =
        qualityRaw === 'wav' || qualityRaw === '320' || qualityRaw === '128'
          ? qualityRaw
          : 'demo';
      const uid = String(req.query.uid || 'guest');
      const grantId = String(req.query.g || '');
      const exp = Number(req.query.exp || 0);
      const sig = String(req.query.sig || '');
      const isDownload = req.query.download === '1' || req.query.download === 'true';

      if (!verifyStreamSignature(songId, quality, uid, grantId, exp, sig)) {
        res.status(403).json({
          success: false,
          code: 'STREAM_SIGNATURE_INVALID',
          error: 'Link phát nhạc không hợp lệ hoặc đã hết hạn. Vui lòng gọi GET /api/v1/songs/:id/stream để lấy link mới.',
        });
        return;
      }

      const grant = streamGrantCache.get(grantId);
      let targetUrl = grant && grant.songId === songId ? grant.url : '';
      let songTitle = grant?.title || songId;
      let songArtists = grant?.artists || 'XuanKen';

      // Public fallback for demo / 128kbps if server restarted while signature is still valid
      if (!targetUrl && (quality === 'demo' || quality === '128')) {
        const songRes = await fetchRtdbJson<RawSong>(`songs/${songId}`);
        if (songRes.ok && songRes.data) {
          songTitle = songRes.data.title || songTitle;
          songArtists = songRes.data.artists || songArtists;
          targetUrl =
            quality === '128'
              ? String(songRes.data.mp3_128Url || '').trim()
              : String(songRes.data.demoUrl || '').trim();
        }
      }

      if (!targetUrl) {
        res.status(404).json({
          success: false,
          error: 'Phiên phát nhạc đã hết hạn trên máy chủ. Vui lòng gọi lại /api/v1/songs/:id/stream.',
        });
        return;
      }

      const upstreamHeaders: Record<string, string> = {};
      if (typeof req.headers.range === 'string' && req.headers.range) {
        upstreamHeaders.Range = req.headers.range;
      }

      const upstreamRes = await fetch(targetUrl, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: upstreamHeaders,
      });
      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        res.status(502).json({
          success: false,
          error: `Không thể tải luồng âm thanh nguồn (HTTP ${upstreamRes.status}).`,
        });
        return;
      }

      const ext = quality === 'wav' ? 'wav' : 'mp3';
      const defaultMime = quality === 'wav' ? 'audio/wav' : 'audio/mpeg';
      const contentType = upstreamRes.headers.get('content-type') || defaultMime;
      const contentLength = upstreamRes.headers.get('content-length');
      const contentRange = upstreamRes.headers.get('content-range');
      const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

      res.status(upstreamRes.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', acceptRanges);
      res.setHeader('Cache-Control', 'private, max-age=300');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (isDownload) {
        const cleanTitle = songTitle.replace(/[\\/:*?"<>|]/g, '').trim() || songId;
        const cleanArtists = songArtists.replace(/[\\/:*?"<>|]/g, '').trim() || 'XuanKen';
        const fileName = `[XuanKen Music] ${cleanTitle} - ${cleanArtists}.${ext}`;
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
        );
      }

      if (req.method === 'HEAD' || !upstreamRes.body) {
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
        else res.destroy();
      });
      nodeStream.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Lỗi phát luồng âm thanh.' });
      }
    }
  });

  // -----------------------------------------------------------------
  // PUBLIC / MOBILE MUSIC API ROUTER (STRICTLY PROTECTED BY ADMIN API KEY)
  // -----------------------------------------------------------------
  const publicRouter = express.Router();
  publicRouter.use(requireApiKey);
  publicRouter.use(resolveOptionalUserContext);

  publicRouter.get(['/', '/info'], (req: AuthenticatedApiRequest, res: Response) => {
    res.json({
      success: true,
      service: 'XuanKen Music API (ZingMP3/NCT Compact Architecture)',
      version: '2.1.0',
      authenticatedAs: req.apiKeyMeta,
      userSession: req.userContext
        ? {
            authenticated: true,
            uid: req.userContext.uid,
            email: req.userContext.email,
            displayName: req.userContext.displayName,
            balance: req.userContext.balance,
            purchasedCount: req.userContext.purchasedSongIds.length,
            isAdmin: req.userContext.isAdmin,
          }
        : { authenticated: false },
      rules: {
        compactLists:
          'Các API danh sách (/home, /songs, /charts, /search) trả về dữ liệu gọn nhẹ và tự động ẩn link 320kbps/WAV (chỉ trả demoUrl & mp3_128Url). Khi bấm nghe bài nào mới gọi GET /api/v1/songs/:id/stream để lấy link phát bảo mật có chữ ký (streamUrls).',
        purchasedAudio:
          'Khi gửi kèm x-user-token (hoặc Bearer idToken cùng x-api-key) của tài khoản đã mua bài hát, /songs/:id/stream và /songs/:id/download tự động mở khóa chất lượng 320kbps & WAV Lossless.',
        personalPlaylists:
          'Playlist cá nhân riêng tư theo từng tài khoản. Không có tài khoản hoặc tài khoản khác không thể xem playlist cá nhân của người khác.',
      },
      endpoints: [
        'GET  /api/v1/home',
        'GET  /api/v1/search?q=...',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/refresh',
        'GET|PATCH /api/v1/me',
        'GET|PATCH /api/v1/me/settings',
        'POST /api/v1/me/likes (song & album)',
        'POST /api/v1/me/album-likes',
        'GET|POST /api/v1/me/blocks & DELETE /api/v1/me/blocks/:songId',
        'GET  /api/v1/songs',
        'GET  /api/v1/songs/:id',
        'GET  /api/v1/songs/:id/stream',
        'GET  /api/v1/songs/:id/download',
        'POST /api/v1/songs/:id/play',
        'POST /api/v1/songs/:id/report',
        'POST /api/v1/songs/:id/purchase',
        'GET|POST /api/v1/purchases',
        'GET  /api/v1/vouchers',
        'GET  /api/v1/vouchers/validate',
        'GET|POST /api/v1/playlists',
        'GET|PATCH|DELETE /api/v1/playlists/:id',
        'GET  /api/v1/albums & /api/v1/albums/:id',
        'GET  /api/v1/artists & /api/v1/artists/:id',
        'GET  /api/v1/charts',
        'GET  /api/v1/site',
      ],
    });
  });

  // -----------------------------------------------------------------
  // HOME BOOTSTRAP & UNIFIED SEARCH (1-CALL MOBILE ENTRYPOINTS)
  // -----------------------------------------------------------------
  publicRouter.get('/home', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext;
      const limit = Math.min(30, Math.max(5, parseInt(String(req.query.limit || '12'), 10) || 12));
      const weekKey = getCurrentWeekKey();

      const [songs, albums, artists, settings, weeklyRaw, vouchersRaw] = await Promise.all([
        getAllSongsForUser(user),
        getAllAlbumsForUser(user),
        getAllPublicArtists(),
        fetchCachedRtdb<Record<string, unknown>>('site_settings'),
        fetchCachedRtdb<Record<string, number>>(`weekly_plays/${weekKey}`),
        fetchCachedRtdb<Record<string, any> | any[]>('vouchers'),
      ]);

      const blockedSet = new Set(user?.blockedSongIds || []);
      const visibleSongs = songs.filter((s) => !blockedSet.has(s.id));

      const newReleases = [...visibleSongs]
        .sort((a, b) => (b.stt ?? 0) - (a.stt ?? 0))
        .slice(0, limit)
        .map((s) => toCompactSong(s));

      const topCharts = [...visibleSongs]
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit)
        .map((s) => toCompactSong(s));

      const weeklyMap = weeklyRaw && typeof weeklyRaw === 'object' ? weeklyRaw : {};
      const weeklyTop = [...visibleSongs]
        .map((s) => ({
          ...toCompactSong(s),
          weeklyPlayCount: Number(weeklyMap[s.id] || 0),
        }))
        .sort((a, b) => b.weeklyPlayCount - a.weeklyPlayCount || b.playCount - a.playCount)
        .slice(0, limit);

      const freeSongs = visibleSongs
        .filter((s) => !s.isPaid)
        .slice(0, limit)
        .map((s) => toCompactSong(s));

      const featuredAlbums = albums.slice(0, limit).map((a) => ({
        id: a.id,
        title: a.title,
        artist: a.artist,
        coverImage: a.coverImage,
        description: a.description,
        releaseYear: a.releaseYear,
        genre: a.genre,
        trackCount: a.trackCount,
        isLiked: Boolean(user?.likedAlbumIds.includes(a.id)),
      }));

      const voucherList: any[] = vouchersRaw
        ? Array.isArray(vouchersRaw)
          ? vouchersRaw.filter(Boolean)
          : Object.values(vouchersRaw).filter(Boolean)
        : [];
      const usedSet = new Set((user?.usedVoucherCodes || []).map((c) => c.toUpperCase()));
      const activeVouchers = voucherList
        .filter((v) => v && v.isActive !== false && v.code)
        .map((v) => ({
          id: v.id,
          code: String(v.code).toUpperCase(),
          discountType: v.discountType,
          discountValue: v.discountValue,
          minSpend: v.minSpend || 0,
          description: v.description || '',
          alreadyUsed: usedSet.has(String(v.code).toUpperCase()),
        }));

      res.json({
        success: true,
        authenticated: Boolean(user),
        weekKey,
        site: settings || {
          siteName: '',
          siteSlogan: '',
        },
        user: user
          ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              avatarUrl: user.member?.avatarUrl || null,
              balance: user.balance,
              purchasedSongIds: user.purchasedSongIds,
              likedSongIds: user.likedSongIds,
              likedAlbumIds: user.likedAlbumIds,
              blockedSongIds: user.blockedSongIds,
              role: user.isAdmin ? 'admin' : 'user',
            }
          : null,
        sections: {
          featuredAlbums,
          newReleases,
          topCharts,
          weeklyTop,
          freeSongs,
          artists: artists.slice(0, limit),
          activeVouchers,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải dữ liệu Trang chủ.' });
    }
  });

  publicRouter.get('/search', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const user = req.userContext;

      const [songs, albums, artists] = await Promise.all([
        getAllSongsForUser(user),
        getAllAlbumsForUser(user),
        getAllPublicArtists(),
      ]);

      const blockedSet = new Set(user?.blockedSongIds || []);
      const matchedSongs = songs
        .filter((s) => !blockedSet.has(s.id))
        .filter((s) =>
          !q
            ? true
            : s.title.toLowerCase().includes(q) ||
              s.artists.toLowerCase().includes(q) ||
              s.album.toLowerCase().includes(q) ||
              s.composer.toLowerCase().includes(q) ||
              s.genre.toLowerCase().includes(q)
        )
        .slice(0, limit)
        .map((s) => toCompactSong(s));

      const matchedAlbums = albums
        .filter((a) =>
          !q
            ? true
            : a.title.toLowerCase().includes(q) ||
              a.artist.toLowerCase().includes(q) ||
              a.genre.toLowerCase().includes(q)
        )
        .slice(0, limit)
        .map((a) => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          coverImage: a.coverImage,
          genre: a.genre,
          releaseYear: a.releaseYear,
          trackCount: a.trackCount,
        }));

      const matchedAlbumTracks = q
        ? albums
            .flatMap((a) =>
              a.songs.map((track) => ({
                ...track,
                albumTitle: a.title,
              }))
            )
            .filter(
              (t) =>
                !blockedSet.has(t.id) &&
                (t.title.toLowerCase().includes(q) || t.artists.toLowerCase().includes(q))
            )
            .slice(0, limit)
            .map((t) => ({
              id: t.id,
              albumId: t.albumId,
              albumTitle: t.albumTitle,
              title: t.title,
              artists: t.artists,
              duration: t.duration,
              coverImage: t.coverImage,
              price: t.price,
              isPaid: t.isPaid,
              isPurchased: t.isPurchased,
              demoUrl: t.demoUrl,
              mp3_128Url: t.mp3_128Url,
            }))
        : [];

      const matchedArtists = artists
        .filter((art: any) =>
          !q
            ? true
            : String(art?.name || '').toLowerCase().includes(q) ||
              String(art?.realName || '').toLowerCase().includes(q)
        )
        .slice(0, limit);

      res.json({
        success: true,
        query: q,
        data: {
          songs: matchedSongs,
          albums: matchedAlbums,
          albumTracks: matchedAlbumTracks,
          artists: matchedArtists,
        },
        totals: {
          songs: matchedSongs.length,
          albums: matchedAlbums.length,
          albumTracks: matchedAlbumTracks.length,
          artists: matchedArtists.length,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tìm kiếm tổng hợp.' });
    }
  });

  // -----------------------------------------------------------------
  // USER ACCOUNT SYNC (SHARED WITH WEB FIREBASE ACCOUNTS - LOGIN ONLY)
  // -----------------------------------------------------------------
  publicRouter.post('/auth/login', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng nhập đầy đủ email và mật khẩu.',
        });
        return;
      }

      const authRes = await signInFirebaseEmail(email, password);
      if (!authRes.ok) {
        res.status(authRes.status).json({
          success: false,
          code: authRes.code,
          error: authRes.error,
        });
        return;
      }

      const userCtx = await loadOrInitUserContext(
        authRes.uid,
        authRes.email,
        authRes.idToken,
        authRes.displayName
      );

      res.json({
        success: true,
        idToken: authRes.idToken,
        refreshToken: authRes.refreshToken,
        expiresIn: authRes.expiresIn,
        user: {
          uid: userCtx.uid,
          email: userCtx.email,
          displayName: userCtx.displayName,
          avatarUrl: userCtx.member?.avatarUrl || null,
          balance: userCtx.balance,
          purchasedSongIds: userCtx.purchasedSongIds,
          likedSongIds: userCtx.likedSongIds,
          likedAlbumIds: userCtx.likedAlbumIds,
          blockedSongIds: userCtx.blockedSongIds,
          usedVoucherCodes: userCtx.usedVoucherCodes,
          settings: {
            theme: userCtx.theme,
            crossfadeDuration: userCtx.crossfadeDuration,
            preferredAudioFormat: userCtx.preferredAudioFormat,
          },
          role: userCtx.isAdmin ? 'admin' : 'user',
          createdAt: userCtx.member?.createdAt || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi đăng nhập tài khoản.',
      });
    }
  });

  publicRouter.post('/auth/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken =
        typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Thiếu refreshToken.',
        });
        return;
      }
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (!refreshed.ok) {
        res.status(refreshed.status).json({
          success: false,
          error: refreshed.error,
        });
        return;
      }
      res.json({
        success: true,
        idToken: refreshed.idToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
        uid: refreshed.uid,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Lỗi làm mới phiên đăng nhập.',
      });
    }
  });

  publicRouter.get('/me', requireUserAuth, (req: AuthenticatedApiRequest, res: Response) => {
    const user = req.userContext!;
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.member?.avatarUrl || null,
        balance: user.balance,
        purchasedSongIds: user.purchasedSongIds,
        likedSongIds: user.likedSongIds,
        likedAlbumIds: user.likedAlbumIds,
        blockedSongIds: user.blockedSongIds,
        usedVoucherCodes: user.usedVoucherCodes,
        settings: {
          theme: user.theme,
          crossfadeDuration: user.crossfadeDuration,
          preferredAudioFormat: user.preferredAudioFormat,
        },
        role: user.isAdmin ? 'admin' : 'user',
        createdAt: user.member?.createdAt || null,
      },
    });
  });

  publicRouter.patch('/me', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const patch: Record<string, any> = {};

      if (typeof req.body?.displayName === 'string' && req.body.displayName.trim()) {
        patch.displayName = req.body.displayName.trim().slice(0, 60);
      }
      if (typeof req.body?.avatarUrl === 'string') {
        const avatar = req.body.avatarUrl.trim();
        if (Buffer.byteLength(avatar, 'utf-8') > 500000) {
          res.status(400).json({
            success: false,
            error: 'avatarUrl quá lớn (tối đa 500KB). Vui lòng dùng link ảnh hoặc nén ảnh nhỏ hơn.',
          });
          return;
        }
        patch.avatarUrl = avatar;
      }

      if (Object.keys(patch).length === 0) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng truyền displayName hoặc avatarUrl cần cập nhật.',
        });
        return;
      }

      const saved = await writeRtdbJson(`members/${user.uid}`, patch, user.idToken, 'PATCH');
      if (!saved) {
        res.status(500).json({ success: false, error: 'Không thể cập nhật hồ sơ lên Firebase.' });
        return;
      }

      res.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: patch.displayName ?? user.displayName,
          avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : user.member?.avatarUrl || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật hồ sơ.' });
    }
  });

  publicRouter.get('/me/settings', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const audioRes = await fetchRtdbJson<{
        preferredFormat?: string;
        formatMap?: Record<string, string>;
        crossfadeDuration?: number;
      }>(`users/${user.uid}/audio_settings`, user.idToken);

      const audio = audioRes.ok && audioRes.data ? audioRes.data : {};
      res.json({
        success: true,
        data: {
          theme: user.theme,
          preferredAudioFormat:
            audio.preferredFormat === 'WAV' || user.preferredAudioFormat === 'WAV' ? 'WAV' : 'MP3',
          crossfadeDuration:
            typeof audio.crossfadeDuration === 'number'
              ? audio.crossfadeDuration
              : user.crossfadeDuration,
          formatMap: audio.formatMap || {},
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải cài đặt cá nhân.' });
    }
  });

  publicRouter.patch('/me/settings', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const memberPatch: Record<string, any> = {};
      const audioPatch: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };

      if (typeof req.body?.theme === 'string' && req.body.theme.trim()) {
        memberPatch.theme = req.body.theme.trim();
      }
      if (typeof req.body?.preferredAudioFormat === 'string') {
        const fmt = req.body.preferredAudioFormat.toUpperCase() === 'WAV' ? 'WAV' : 'MP3';
        memberPatch.preferredAudioFormat = fmt;
        audioPatch.preferredFormat = fmt;
      }
      if (typeof req.body?.crossfadeDuration === 'number' && Number.isFinite(req.body.crossfadeDuration)) {
        const cf = Math.min(12, Math.max(0, Math.round(req.body.crossfadeDuration)));
        memberPatch.crossfadeDuration = cf;
        audioPatch.crossfadeDuration = cf;
      }
      if (req.body?.formatMap && typeof req.body.formatMap === 'object') {
        audioPatch.formatMap = req.body.formatMap;
      }

      if (Object.keys(memberPatch).length > 0) {
        await writeRtdbJson(`members/${user.uid}`, memberPatch, user.idToken, 'PATCH');
      }
      if (Object.keys(audioPatch).length > 1) {
        await writeRtdbJson(`users/${user.uid}/audio_settings`, audioPatch, user.idToken, 'PATCH');
      }

      res.json({
        success: true,
        data: {
          theme: memberPatch.theme ?? user.theme,
          preferredAudioFormat: memberPatch.preferredAudioFormat ?? user.preferredAudioFormat,
          crossfadeDuration: memberPatch.crossfadeDuration ?? user.crossfadeDuration,
          formatMap: audioPatch.formatMap ?? undefined,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi lưu cài đặt cá nhân.' });
    }
  });

  async function handleLikeToggle(req: AuthenticatedApiRequest, res: Response, forceAlbum = false) {
    try {
      const user = req.userContext!;
      const isAlbum =
        forceAlbum || req.body?.type === 'album' || (Boolean(req.body?.albumId) && !req.body?.songId);
      const targetId = isAlbum
        ? typeof (req.body?.albumId || req.body?.id) === 'string'
          ? String(req.body?.albumId || req.body?.id).trim()
          : ''
        : typeof (req.body?.songId || req.body?.id) === 'string'
        ? String(req.body?.songId || req.body?.id).trim()
        : '';

      if (!targetId) {
        res.status(400).json({
          success: false,
          error: isAlbum ? 'Thiếu albumId.' : 'Thiếu songId.',
        });
        return;
      }

      if (isAlbum) {
        const currentSet = new Set(user.likedAlbumIds);
        const shouldLike =
          typeof req.body?.liked === 'boolean' ? req.body.liked : !currentSet.has(targetId);
        if (shouldLike) currentSet.add(targetId);
        else currentSet.delete(targetId);
        const nextAlbumLikes = Array.from(currentSet);

        const savedMember = await writeRtdbJson(
          `members/${user.uid}`,
          { likedAlbumIds: nextAlbumLikes },
          user.idToken,
          'PATCH'
        );
        await writeRtdbJson(
          `users/${user.uid}/liked_albums`,
          { likedAlbumIds: nextAlbumLikes, updatedAt: Date.now() },
          user.idToken,
          'PUT'
        );

        res.json({
          success: savedMember,
          type: 'album',
          albumId: targetId,
          liked: shouldLike,
          likedAlbumIds: nextAlbumLikes,
        });
        return;
      }

      const currentSet = new Set(user.likedSongIds);
      const shouldLike =
        typeof req.body?.liked === 'boolean' ? req.body.liked : !currentSet.has(targetId);
      if (shouldLike) currentSet.add(targetId);
      else currentSet.delete(targetId);
      const nextLikes = Array.from(currentSet);

      const savedMember = await writeRtdbJson(
        `members/${user.uid}`,
        { likedSongIds: nextLikes },
        user.idToken,
        'PATCH'
      );
      await writeRtdbJson(
        `users/${user.uid}/liked_songs`,
        { likedSongIds: nextLikes, updatedAt: Date.now() },
        user.idToken,
        'PUT'
      );

      res.json({
        success: savedMember,
        type: 'song',
        songId: targetId,
        liked: shouldLike,
        likedSongIds: nextLikes,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật danh sách yêu thích.' });
    }
  }

  publicRouter.post('/me/likes', requireUserAuth, (req: AuthenticatedApiRequest, res: Response) => {
    void handleLikeToggle(req, res, false);
  });

  publicRouter.post('/me/album-likes', requireUserAuth, (req: AuthenticatedApiRequest, res: Response) => {
    void handleLikeToggle(req, res, true);
  });

  // Blocked songs management
  publicRouter.get('/me/blocks', requireUserAuth, (req: AuthenticatedApiRequest, res: Response) => {
    res.json({
      success: true,
      blockedSongIds: req.userContext!.blockedSongIds,
    });
  });

  publicRouter.post('/me/blocks', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const songId = typeof req.body?.songId === 'string' ? req.body.songId.trim() : '';
      if (!songId) {
        res.status(400).json({ success: false, error: 'Thiếu songId.' });
        return;
      }
      const next = Array.from(new Set([...user.blockedSongIds, songId]));
      const saved = await writeRtdbJson(
        `members/${user.uid}`,
        { blockedSongIds: next },
        user.idToken,
        'PATCH'
      );
      res.json({ success: saved, blockedSongIds: next });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi chặn bài hát.' });
    }
  });

  publicRouter.delete('/me/blocks/:songId', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const songId = String(req.params.songId || '').trim();
      const next = user.blockedSongIds.filter((id) => id !== songId);
      const saved = await writeRtdbJson(
        `members/${user.uid}`,
        { blockedSongIds: next },
        user.idToken,
        'PATCH'
      );
      res.json({ success: saved, blockedSongIds: next });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi bỏ chặn bài hát.' });
    }
  });

  // -----------------------------------------------------------------
  // SONGS, STREAMING, DOWNLOAD, PLAY COUNT & REPORTS
  // -----------------------------------------------------------------
  publicRouter.get('/songs', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext;
      let songs = await getAllSongsForUser(user);

      const includeBlocked = req.query.includeBlocked === '1' || req.query.includeBlocked === 'true';
      if (user && !includeBlocked && user.blockedSongIds.length > 0) {
        const blocked = new Set(user.blockedSongIds);
        songs = songs.filter((s) => !blocked.has(s.id));
      }

      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const genre = typeof req.query.genre === 'string' ? req.query.genre.trim().toLowerCase() : '';
      const artist = typeof req.query.artist === 'string' ? req.query.artist.trim().toLowerCase() : '';
      const paidFilter = typeof req.query.paid === 'string' ? req.query.paid.trim().toLowerCase() : '';
      const purchasedFilter = typeof req.query.purchased === 'string' ? req.query.purchased.trim().toLowerCase() : '';
      const sort = typeof req.query.sort === 'string' ? req.query.sort.trim().toLowerCase() : 'stt';
      const includeLinks = req.query.includeLinks === '1' || req.query.includeLinks === 'true';

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
      if (purchasedFilter === 'true' || purchasedFilter === '1') {
        songs = songs.filter((s) => s.isPurchased);
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
      const items = songs.slice(start, start + limit).map((s) => toCompactSong(s, includeLinks));

      res.json({
        success: true,
        authenticated: Boolean(user),
        userId: user?.uid || null,
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

  publicRouter.get('/songs/:id', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const songs = await getAllSongsForUser(req.userContext);
      const found = songs.find((s) => s.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }
      const streamUrls = buildStreamUrlsForSong(req, found, req.userContext?.uid);
      res.json({
        success: true,
        authenticated: Boolean(req.userContext),
        data: {
          ...found,
          streamUrls,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải chi tiết bài hát' });
    }
  });

  publicRouter.get('/songs/:id/stream', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const songs = await getAllSongsForUser(req.userContext);
      const found = songs.find((s) => s.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }

      const streamUrls = buildStreamUrlsForSong(req, found, req.userContext?.uid);
      res.json({
        success: true,
        authenticated: Boolean(req.userContext),
        data: {
          songId: found.id,
          title: found.title,
          artists: found.artists,
          duration: found.duration,
          price: found.price,
          isPaid: found.isPaid,
          isPurchased: found.isPurchased,
          hasFullAccess: found.hasFullAccess,
          streamType: found.availableStreamType,
          expiresInSeconds: Math.round(STREAM_TTL_MS / 1000),
          streamUrls,
          demoUrl: found.demoUrl,
          mp3_128Url: found.mp3_128Url,
          mp3Url: found.mp3Url,
          wavUrl: found.wavUrl,
          audioUrl: found.audioUrl,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi lấy luồng phát nhạc' });
    }
  });

  publicRouter.get('/songs/:id/download', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const songs = await getAllSongsForUser(req.userContext);
      const found = songs.find((s) => s.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }
      if (!found.hasFullAccess) {
        res.status(req.userContext ? 403 : 401).json({
          success: false,
          code: 'PURCHASE_REQUIRED',
          error: 'Bạn cần mua bản quyền bài hát này trước khi tải chất lượng cao (320kbps / WAV).',
        });
        return;
      }

      const formatParam = String(req.query.format || found.audioFormat || 'MP3').toUpperCase();
      const wantWav = formatParam === 'WAV' && Boolean(found.wavUrl);
      const targetUrl = wantWav
        ? found.wavUrl
        : found.mp3Url || found.wavUrl || found.mp3_128Url || found.demoUrl;
      if (!targetUrl) {
        res.status(404).json({ success: false, error: 'Bài hát chưa có file tải về.' });
        return;
      }

      const quality: StreamQuality =
        targetUrl === found.wavUrl
          ? 'wav'
          : targetUrl === found.mp3Url
          ? '320'
          : targetUrl === found.mp3_128Url
          ? '128'
          : 'demo';

      const signedDownloadUrl = createSignedStreamUrl(req, {
        songId: found.id,
        quality,
        targetUrl,
        title: found.title,
        artists: found.artists,
        uid: req.userContext?.uid,
        download: true,
      });

      if (req.query.mode === 'stream') {
        res.redirect(302, signedDownloadUrl);
        return;
      }

      const cleanTitle = found.title.replace(/[\\/:*?"<>|]/g, '').trim() || found.id;
      const cleanArtists = found.artists.replace(/[\\/:*?"<>|]/g, '').trim() || 'XuanKen';
      const ext = quality === 'wav' ? 'wav' : 'mp3';

      res.json({
        success: true,
        data: {
          songId: found.id,
          title: found.title,
          format: quality === 'wav' ? 'WAV' : 'MP3',
          fileName: `[XuanKen Music] ${cleanTitle} - ${cleanArtists}.${ext}`,
          expiresInSeconds: Math.round(STREAM_TTL_MS / 1000),
          downloadUrl: signedDownloadUrl,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tạo link tải nhạc.' });
    }
  });

  publicRouter.post('/songs/:id/play', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const songId = String(req.params.id || '').trim();
      const found = await findRawSongById(songId);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }

      const currentCount = typeof found.raw.playCount === 'number' ? found.raw.playCount : 0;
      const nextPlayCount = currentCount + 1;
      await writeRtdbJson(`songs/${found.id}/playCount`, nextPlayCount, req.userContext?.idToken, 'PUT');

      const weekKey = getCurrentWeekKey();
      let nextWeeklyCount: number | null = null;
      if (req.userContext?.idToken) {
        const weeklyRes = await fetchRtdbJson<number>(
          `weekly_plays/${weekKey}/${found.id}`,
          req.userContext.idToken
        );
        const curWeekly = weeklyRes.ok && typeof weeklyRes.data === 'number' ? weeklyRes.data : 0;
        nextWeeklyCount = curWeekly + 1;
        await writeRtdbJson(
          `weekly_plays/${weekKey}/${found.id}`,
          nextWeeklyCount,
          req.userContext.idToken,
          'PUT'
        );
      }

      // Invalidate cached songs & weekly_plays so charts stay fresh
      catalogCache.delete('songs');
      catalogCache.delete(`weekly_plays/${weekKey}`);

      res.json({
        success: true,
        songId: found.id,
        playCount: nextPlayCount,
        weekKey,
        weeklyPlayCount: nextWeeklyCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi ghi nhận lượt nghe.' });
    }
  });

  publicRouter.post('/songs/:id/report', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const songId = String(req.params.id || '').trim();
      const issue = typeof req.body?.issue === 'string' ? req.body.issue.trim() : '';
      if (!songId || !issue) {
        res.status(400).json({ success: false, error: 'Vui lòng nhập nội dung báo lỗi (issue).' });
        return;
      }

      const reportId = `${songId}_${Date.now()}`;
      const payload = {
        songId,
        issue: issue.slice(0, 500),
        userEmail: req.userContext?.email || 'Khách API',
        userId: req.userContext?.uid || null,
        source: 'api',
        createdAt: new Date().toISOString(),
      };
      const saved = await writeRtdbJson(`song_reports/${reportId}`, payload, req.userContext?.idToken, 'PUT');
      if (!saved) {
        res.status(500).json({ success: false, error: 'Không thể gửi báo lỗi lên Firebase.' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Đã gửi báo cáo lỗi bài hát thành công!',
        reportId,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi gửi báo cáo bài hát.' });
    }
  });

  // -----------------------------------------------------------------
  // VOUCHERS & SONG PURCHASE API (FOR MOBILE APP)
  // -----------------------------------------------------------------
  async function findRawSongById(songId: string): Promise<{ id: string; raw: RawSong } | null> {
    const direct = await fetchRtdbJson<RawSong>(`songs/${songId}`);
    if (direct.ok && direct.data) {
      return { id: direct.data.id || songId, raw: direct.data };
    }
    const allRaw = await fetchRtdbJson<Record<string, RawSong> | RawSong[]>('songs');
    if (allRaw.ok && allRaw.data) {
      const entries: Array<[string, RawSong]> = Array.isArray(allRaw.data)
        ? allRaw.data.map((s, idx): [string, RawSong] => [s?.id || `song-${idx + 1}`, s]).filter(([, s]) => Boolean(s))
        : Object.entries(allRaw.data);
      const matched = entries.find(([k, v]) => k === songId || v?.id === songId);
      if (matched) {
        return { id: matched[1]?.id || matched[0], raw: matched[1] };
      }
    }
    return null;
  }

  async function evaluateVoucher(
    codeInput: string,
    originalPrice: number,
    usedVoucherCodes: string[] = []
  ): Promise<{
    valid: boolean;
    error?: string;
    voucher?: any;
    discountAmount: number;
    finalPrice: number;
  }> {
    const normalized = codeInput.trim().toUpperCase();
    if (!normalized) {
      return { valid: true, discountAmount: 0, finalPrice: originalPrice };
    }
    if (usedVoucherCodes.map((c) => c.toUpperCase()).includes(normalized)) {
      return {
        valid: false,
        error: `Bạn đã sử dụng mã giảm giá "${normalized}" trước đó rồi.`,
        discountAmount: 0,
        finalPrice: originalPrice,
      };
    }

    const vouchersRes = await fetchRtdbJson<Record<string, any> | any[]>('vouchers');
    const list: any[] = vouchersRes.ok && vouchersRes.data
      ? Array.isArray(vouchersRes.data)
        ? vouchersRes.data.filter(Boolean)
        : Object.values(vouchersRes.data).filter(Boolean)
      : [];

    const voucher = list.find(
      (v) => String(v?.code || '').trim().toUpperCase() === normalized && v?.isActive !== false
    );
    if (!voucher) {
      return {
        valid: false,
        error: `Mã giảm giá "${normalized}" không tồn tại hoặc đã hết hạn.`,
        discountAmount: 0,
        finalPrice: originalPrice,
      };
    }

    const minSpend = typeof voucher.minSpend === 'number' ? voucher.minSpend : 0;
    if (originalPrice < minSpend) {
      return {
        valid: false,
        error: `Mã "${normalized}" yêu cầu đơn tối thiểu ${minSpend.toLocaleString('vi-VN')}đ.`,
        discountAmount: 0,
        finalPrice: originalPrice,
      };
    }

    const discountVal = Number(voucher.discountValue) || 0;
    let discountAmount = 0;
    if (voucher.discountType === 'percent') {
      discountAmount = Math.round((originalPrice * discountVal) / 100);
    } else {
      discountAmount = discountVal;
    }
    discountAmount = Math.min(originalPrice, Math.max(0, discountAmount));
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      voucher,
      discountAmount,
      finalPrice,
    };
  }

  publicRouter.get('/vouchers', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const vouchersRes = await fetchRtdbJson<Record<string, any> | any[]>('vouchers');
      const list: any[] =
        vouchersRes.ok && vouchersRes.data
          ? Array.isArray(vouchersRes.data)
            ? vouchersRes.data.filter(Boolean)
            : Object.values(vouchersRes.data).filter(Boolean)
          : [];
      const usedSet = new Set(
        (req.userContext?.usedVoucherCodes || []).map((c) => c.toUpperCase())
      );

      const active = list
        .filter((v) => v && v.isActive !== false && v.code)
        .map((v) => ({
          id: v.id,
          code: String(v.code).toUpperCase(),
          discountType: v.discountType,
          discountValue: v.discountValue,
          minSpend: typeof v.minSpend === 'number' ? v.minSpend : 0,
          description: v.description || '',
          alreadyUsed: usedSet.has(String(v.code).toUpperCase()),
        }));

      res.json({
        success: true,
        total: active.length,
        data: active,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách voucher.' });
    }
  });

  publicRouter.get('/vouchers/validate', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code.trim() : '';
      const songId = typeof req.query.songId === 'string' ? req.query.songId.trim() : '';
      if (!code) {
        res.status(400).json({ success: false, error: 'Vui lòng truyền tham số ?code=...' });
        return;
      }

      let originalPrice = Number(req.query.amount) || 0;
      if (songId) {
        const found = await findRawSongById(songId);
        if (!found) {
          res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
          return;
        }
        originalPrice =
          typeof found.raw.price === 'number'
            ? found.raw.price
            : Number(found.raw.price) || 0;
      }

      const result = await evaluateVoucher(
        code,
        originalPrice,
        req.userContext?.usedVoucherCodes || []
      );
      if (!result.valid) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      res.json({
        success: true,
        code: result.voucher?.code,
        discountType: result.voucher?.discountType,
        discountValue: result.voucher?.discountValue,
        description: result.voucher?.description || '',
        originalPrice,
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi kiểm tra voucher.' });
    }
  });

  async function handleSongPurchase(req: AuthenticatedApiRequest, res: Response, targetSongId: string) {
    try {
      const user = req.userContext!;
      const songId = targetSongId.trim();
      if (!songId) {
        res.status(400).json({ success: false, error: 'Thiếu songId để mua bài hát.' });
        return;
      }

      const found = await findRawSongById(songId);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy bài hát.' });
        return;
      }

      const rawSong = found.raw;
      const originalPrice =
        typeof rawSong.price === 'number' ? rawSong.price : Number(rawSong.price) || 0;

      // Already owned or free
      if (originalPrice <= 0 || user.purchasedSongIds.includes(found.id)) {
        const masterRes = await fetchRtdbJson<SongMasterRecord>(
          `song_masters/${found.id}`,
          user.idToken
        );
        const unlockedSong = sanitizeSongForUser(
          rawSong,
          found.id,
          user,
          masterRes.ok ? masterRes.data : null
        );
        res.json({
          success: true,
          alreadyPurchased: true,
          message:
            originalPrice <= 0
              ? 'Bài hát này miễn phí, bạn đã có quyền nghe toàn bộ.'
              : 'Tài khoản của bạn đã mua bài hát này rồi.',
          balance: user.balance,
          purchasedSongIds: user.purchasedSongIds,
          song: unlockedSong,
        });
        return;
      }

      // Optional voucher
      const voucherCode =
        typeof req.body?.voucherCode === 'string' ? req.body.voucherCode.trim() : '';
      const voucherCheck = await evaluateVoucher(
        voucherCode,
        originalPrice,
        user.usedVoucherCodes
      );
      if (!voucherCheck.valid) {
        res.status(400).json({ success: false, error: voucherCheck.error });
        return;
      }

      const finalPrice = voucherCheck.finalPrice;
      if (user.balance < finalPrice) {
        res.status(402).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          error: `Số dư tài khoản không đủ (${user.balance.toLocaleString('vi-VN')}đ < ${finalPrice.toLocaleString('vi-VN')}đ). Vui lòng nạp thêm tiền.`,
          currentBalance: user.balance,
          requiredAmount: finalPrice,
          shortfall: finalPrice - user.balance,
        });
        return;
      }

      const newBalance = user.balance - finalPrice;
      const nextPurchased = Array.from(new Set([...user.purchasedSongIds, found.id]));
      const nextUsedVouchers =
        voucherCheck.voucher?.code
          ? Array.from(new Set([...user.usedVoucherCodes, String(voucherCheck.voucher.code).toUpperCase()]))
          : user.usedVoucherCodes;

      const memberPatch: Record<string, any> = {
        balance: newBalance,
        purchasedSongIds: nextPurchased,
      };
      if (nextUsedVouchers.length > 0) {
        memberPatch.usedVoucherCodes = nextUsedVouchers;
      }

      const memberUpdated = await writeRtdbJson(
        `members/${user.uid}`,
        memberPatch,
        user.idToken,
        'PATCH'
      );
      if (!memberUpdated) {
        res.status(500).json({
          success: false,
          error: 'Không thể cập nhật số dư thành viên trên Firebase. Vui lòng kiểm tra Firebase Rules.',
        });
        return;
      }

      const purchaseId = `pur_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const timestamp = new Date().toISOString();
      const purchaseRecord = {
        id: purchaseId,
        userId: user.uid,
        userEmail: user.email,
        songId: found.id,
        songTitle: rawSong.title || 'Bài hát',
        price: finalPrice,
        originalPrice,
        discountAmount: voucherCheck.discountAmount,
        voucherCode: voucherCheck.voucher?.code || null,
        source: 'mobile_api',
        timestamp,
      };

      // Write user_purchases entitlement first so song_masters/{id} unlocks immediately for this user
      await writeRtdbJson(
        `user_purchases/${user.uid}/${found.id}`,
        {
          songId: found.id,
          purchaseId,
          price: finalPrice,
          purchasedAt: timestamp,
        },
        user.idToken,
        'PUT'
      );
      await writeRtdbJson(`purchases/${purchaseId}`, purchaseRecord, user.idToken, 'PUT');

      // Update local user context and fetch protected master links
      user.balance = newBalance;
      user.purchasedSongIds = nextPurchased;
      user.usedVoucherCodes = nextUsedVouchers;

      const masterRes = await fetchRtdbJson<SongMasterRecord>(
        `song_masters/${found.id}`,
        user.idToken
      );
      const unlockedSong = sanitizeSongForUser(
        rawSong,
        found.id,
        user,
        masterRes.ok ? masterRes.data : null
      );

      res.status(201).json({
        success: true,
        alreadyPurchased: false,
        message: `Mua thành công bài hát "${unlockedSong.title}"! Đã mở khóa link chất lượng cao (320kbps / WAV).`,
        purchase: purchaseRecord,
        balance: newBalance,
        purchasedSongIds: nextPurchased,
        song: unlockedSong,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi mua bài hát qua API.' });
    }
  }

  publicRouter.post('/songs/:id/purchase', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    await handleSongPurchase(req, res, String(req.params.id || ''));
  });

  publicRouter.post('/purchases', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    const songId = typeof req.body?.songId === 'string' ? req.body.songId : '';
    await handleSongPurchase(req, res, songId);
  });

  publicRouter.get('/purchases', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const entRes = await fetchRtdbJson<Record<string, any>>(
        `user_purchases/${user.uid}`,
        user.idToken
      );
      const entitlements =
        entRes.ok && entRes.data && typeof entRes.data === 'object'
          ? Object.values(entRes.data).filter(Boolean)
          : [];

      // Resolve detailed purchase records referenced by entitlements
      const purchaseIds = entitlements
        .map((e: any) => e?.purchaseId)
        .filter((pid: any): pid is string => typeof pid === 'string' && pid !== 'synced');

      const detailList = await Promise.all(
        purchaseIds.map(async (pid) => {
          const pRes = await fetchRtdbJson<any>(`purchases/${pid}`, user.idToken);
          return pRes.ok ? pRes.data : null;
        })
      );

      res.json({
        success: true,
        uid: user.uid,
        balance: user.balance,
        purchasedSongIds: user.purchasedSongIds,
        entitlements,
        purchases: detailList.filter(Boolean),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải lịch sử mua bài hát.' });
    }
  });

  // -----------------------------------------------------------------
  // ALBUMS, ARTISTS, CHARTS
  // -----------------------------------------------------------------
  publicRouter.get('/albums', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      let albums = await getAllAlbumsForUser(req.userContext);
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
        authenticated: Boolean(req.userContext),
        total,
        page,
        limit,
        data: items,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách album' });
    }
  });

  publicRouter.get('/albums/:id', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const albums = await getAllAlbumsForUser(req.userContext);
      const found = albums.find((a) => a.id === req.params.id);
      if (!found) {
        res.status(404).json({ success: false, error: 'Không tìm thấy album.' });
        return;
      }
      res.json({
        success: true,
        authenticated: Boolean(req.userContext),
        data: found,
      });
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

  publicRouter.get('/artists/:id', async (req: AuthenticatedApiRequest, res: Response) => {
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
      const includeLinks = req.query.includeLinks === '1' || req.query.includeLinks === 'true';
      const songs = await getAllSongsForUser(req.userContext);
      const artistNameLower = String((artist as any).name || '').toLowerCase();
      const artistSongs = songs
        .filter((s) =>
          s.artists
            .split(',')
            .map((n) => n.trim().toLowerCase())
            .includes(artistNameLower)
        )
        .map((s) => toCompactSong(s, includeLinks));

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

  publicRouter.get('/charts', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
      const includeLinks = req.query.includeLinks === '1' || req.query.includeLinks === 'true';
      const weekKey = getCurrentWeekKey();

      const [songs, weekly] = await Promise.all([
        getAllSongsForUser(req.userContext),
        fetchCachedRtdb<Record<string, number>>(`weekly_plays/${weekKey}`),
      ]);

      const topAllTime = [...songs]
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit)
        .map((s) => toCompactSong(s, includeLinks));

      const weeklyMap = weekly && typeof weekly === 'object' ? weekly : {};
      const topWeekly = [...songs]
        .map((s) => ({
          ...toCompactSong(s, includeLinks),
          weeklyPlayCount: Number(weeklyMap[s.id] || 0),
        }))
        .sort((a, b) => b.weeklyPlayCount - a.weeklyPlayCount || b.playCount - a.playCount)
        .slice(0, limit);

      res.json({
        success: true,
        weekKey,
        data: {
          topSongs: topAllTime,
          weeklyTopSongs: topWeekly,
          weeklyPlays: weekly || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải bảng xếp hạng' });
    }
  });

  // -----------------------------------------------------------------
  // PERSONAL PLAYLISTS (STRICTLY PRIVATE PER USER ACCOUNT)
  // -----------------------------------------------------------------
  publicRouter.get('/playlists', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext;
      // Guest / unauthenticated API calls MUST NOT see anyone's personal playlists
      if (!user) {
        res.json({
          success: true,
          authenticated: false,
          total: 0,
          data: [],
          message:
            'Playlist cá nhân là dữ liệu riêng tư theo tài khoản. Vui lòng truyền x-user-token (hoặc Bearer idToken cùng x-api-key) để xem danh sách playlist của tài khoản đang đăng nhập.',
        });
        return;
      }

      const includeAllAsAdmin = user.isAdmin && req.query.scope === 'all';
      const playlistsRes = includeAllAsAdmin
        ? await fetchRtdbJson<Record<string, any> | any[]>('playlists', user.idToken)
        : await fetchRtdbJson<Record<string, any> | any[]>(
            'playlists',
            user.idToken,
            {
              orderBy: '"userId"',
              equalTo: JSON.stringify(user.uid),
            }
          );

      const rawList =
        playlistsRes.ok && playlistsRes.data
          ? Array.isArray(playlistsRes.data)
            ? playlistsRes.data.filter(Boolean)
            : Object.values(playlistsRes.data).filter(Boolean)
          : [];

      const scoped = includeAllAsAdmin
        ? rawList
        : rawList.filter((p: any) => p && p.userId === user.uid);

      const formatted = scoped.map((p: any) => ({
        ...p,
        songIds: Array.isArray(p.songIds) ? p.songIds : [],
      }));

      const expandSongs =
        req.query.expand === 'songs' || req.query.expand === 'true' || req.query.expand === '1';
      if (expandSongs && formatted.length > 0) {
        const allSongs = await getAllSongsForUser(user);
        const byId = new Map(allSongs.map((s) => [s.id, toCompactSong(s)]));
        for (const pl of formatted) {
          pl.songs = pl.songIds
            .map((sid: string) => byId.get(sid))
            .filter(Boolean);
        }
      }

      res.json({
        success: true,
        authenticated: true,
        userId: user.uid,
        total: formatted.length,
        data: formatted,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải danh sách playlist cá nhân' });
    }
  });

  publicRouter.get('/playlists/:id', async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const playlistRes = await fetchRtdbJson<any>(
        `playlists/${req.params.id}`,
        req.userContext?.idToken
      );
      if (!playlistRes.ok || !playlistRes.data) {
        if (playlistRes.status === 401 || playlistRes.status === 403) {
          res.status(req.userContext ? 403 : 401).json({
            success: false,
            error: 'Bạn không có quyền truy cập playlist cá nhân này.',
          });
          return;
        }
        res.status(404).json({ success: false, error: 'Không tìm thấy playlist.' });
        return;
      }

      const pl = playlistRes.data;
      const isOwnerOrAdmin = Boolean(
        req.userContext && (pl.userId === req.userContext.uid || req.userContext.isAdmin)
      );
      if (!pl.isPublic && !isOwnerOrAdmin) {
        res.status(req.userContext ? 403 : 401).json({
          success: false,
          error: 'Playlist cá nhân này thuộc về tài khoản khác.',
        });
        return;
      }

      const songIds = Array.isArray(pl.songIds) ? pl.songIds : [];
      const allSongs = await getAllSongsForUser(req.userContext);
      const byId = new Map(allSongs.map((s) => [s.id, toCompactSong(s)]));

      res.json({
        success: true,
        data: {
          ...pl,
          songIds,
          songs: songIds.map((sid: string) => byId.get(sid)).filter(Boolean),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tải chi tiết playlist' });
    }
  });

  publicRouter.post('/playlists', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!name) {
        res.status(400).json({ success: false, error: 'Vui lòng nhập tên playlist.' });
        return;
      }

      const id = `pl_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const playlist = {
        id,
        name: name.slice(0, 100),
        description:
          typeof req.body?.description === 'string'
            ? req.body.description.trim().slice(0, 300)
            : '',
        userId: user.uid,
        songIds: Array.isArray(req.body?.songIds)
          ? Array.from(new Set(req.body.songIds.filter((s: any) => typeof s === 'string')))
          : [],
        isPublic: Boolean(req.body?.isPublic),
        createdAt: new Date().toISOString(),
      };

      const saved = await writeRtdbJson(`playlists/${id}`, playlist, user.idToken, 'PUT');
      if (!saved) {
        res.status(500).json({ success: false, error: 'Không thể lưu playlist lên Firebase.' });
        return;
      }

      res.status(201).json({ success: true, data: playlist });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi tạo playlist cá nhân' });
    }
  });

  publicRouter.patch('/playlists/:id', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const { id } = req.params;
      const existingRes = await fetchRtdbJson<any>(`playlists/${id}`, user.idToken);
      if (!existingRes.ok || !existingRes.data) {
        res.status(existingRes.status === 401 || existingRes.status === 403 ? 403 : 404).json({
          success: false,
          error:
            existingRes.status === 401 || existingRes.status === 403
              ? 'Bạn không có quyền chỉnh sửa playlist này.'
              : 'Không tìm thấy playlist.',
        });
        return;
      }

      const existing = existingRes.data;
      if (existing.userId !== user.uid && !user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Chỉ chủ sở hữu mới được chỉnh sửa playlist này.',
        });
        return;
      }

      let songIds: string[] = Array.isArray(existing.songIds) ? [...existing.songIds] : [];
      if (Array.isArray(req.body?.songIds)) {
        songIds = Array.from(new Set(req.body.songIds.filter((s: any) => typeof s === 'string')));
      }
      if (typeof req.body?.addSongId === 'string' && req.body.addSongId.trim()) {
        const sid = req.body.addSongId.trim();
        if (!songIds.includes(sid)) songIds.push(sid);
      }
      if (typeof req.body?.removeSongId === 'string' && req.body.removeSongId.trim()) {
        const sid = req.body.removeSongId.trim();
        songIds = songIds.filter((s) => s !== sid);
      }

      const updated = {
        ...existing,
        name:
          typeof req.body?.name === 'string' && req.body.name.trim()
            ? req.body.name.trim().slice(0, 100)
            : existing.name,
        description:
          typeof req.body?.description === 'string'
            ? req.body.description.trim().slice(0, 300)
            : existing.description || '',
        isPublic:
          typeof req.body?.isPublic === 'boolean' ? req.body.isPublic : Boolean(existing.isPublic),
        songIds,
      };

      const saved = await writeRtdbJson(`playlists/${id}`, updated, user.idToken, 'PUT');
      if (!saved) {
        res.status(500).json({ success: false, error: 'Không thể cập nhật playlist.' });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật playlist' });
    }
  });

  publicRouter.delete('/playlists/:id', requireUserAuth, async (req: AuthenticatedApiRequest, res: Response) => {
    try {
      const user = req.userContext!;
      const { id } = req.params;
      const existingRes = await fetchRtdbJson<any>(`playlists/${id}`, user.idToken);
      if (!existingRes.ok || !existingRes.data) {
        res.status(existingRes.status === 401 || existingRes.status === 403 ? 403 : 404).json({
          success: false,
          error:
            existingRes.status === 401 || existingRes.status === 403
              ? 'Bạn không có quyền xóa playlist này.'
              : 'Không tìm thấy playlist.',
        });
        return;
      }

      if (existingRes.data.userId !== user.uid && !user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Chỉ chủ sở hữu mới được xóa playlist này.',
        });
        return;
      }

      await writeRtdbJson(`playlists/${id}`, null, user.idToken, 'DELETE');
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lỗi xóa playlist' });
    }
  });

  publicRouter.get('/site', async (_req: Request, res: Response) => {
    try {
      const settings = await fetchCachedRtdb<Record<string, unknown>>('site_settings');
      res.json({
        success: true,
        data: settings || {
          siteName: '',
          siteSlogan: '',
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

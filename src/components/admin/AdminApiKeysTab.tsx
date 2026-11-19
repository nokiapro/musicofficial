import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Power,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Play,
  Code2,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { ref, get, set, remove } from 'firebase/database';
import { auth, rtdb } from '../../services/firebase';

export interface ApiKeyItem {
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

const TEST_ENDPOINTS = [
  { label: 'Trang chủ 1-Call (/api/v1/home)', path: '/api/v1/home?limit=10' },
  { label: 'Tìm kiếm tổng hợp (/api/v1/search)', path: '/api/v1/search?q=xuan' },
  { label: 'Danh sách bài hát gọn (/api/v1/songs)', path: '/api/v1/songs?limit=5' },
  { label: 'Thông tin tài khoản (/api/v1/me)', path: '/api/v1/me' },
  { label: 'Cài đặt nghe nhạc & Theme (/api/v1/me/settings)', path: '/api/v1/me/settings' },
  { label: 'Bài hát đã chặn (/api/v1/me/blocks)', path: '/api/v1/me/blocks' },
  { label: 'Playlist cá nhân (/api/v1/playlists?expand=songs)', path: '/api/v1/playlists?expand=songs' },
  { label: 'Lịch sử bài hát đã mua (/api/v1/purchases)', path: '/api/v1/purchases' },
  { label: 'Voucher đang hoạt động (/api/v1/vouchers)', path: '/api/v1/vouchers' },
  { label: 'Album nhạc hay (/api/v1/albums)', path: '/api/v1/albums' },
  { label: 'Ca sĩ & Tiểu sử (/api/v1/artists)', path: '/api/v1/artists' },
  { label: 'Bảng xếp hạng tuần & tổng (/api/v1/charts)', path: '/api/v1/charts?limit=10' },
  { label: 'Thông tin hệ thống (/api/v1/info)', path: '/api/v1/info' },
];

export const AdminApiKeysTab: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudSynced, setCloudSynced] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create form
  const [newKeyName, setNewKeyName] = useState('');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Key UI states
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

  // Live API Tester
  const [selectedTestKey, setSelectedTestKey] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState(TEST_ENDPOINTS[0].path);
  const [includeUserToken, setIncludeUserToken] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    ok: boolean;
    body: string;
  } | null>(null);

  const getAdminAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Phiên đăng nhập Firebase Admin chưa sẵn sàng. Vui lòng đăng nhập lại.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const safeParseJson = async (res: Response): Promise<{ isJson: boolean; data: any; rawText: string }> => {
    const rawText = await res.text();
    try {
      const data = JSON.parse(rawText);
      return { isJson: true, data, rawText };
    } catch {
      return { isJson: false, data: null, rawText };
    }
  };

  const sha256Hex = async (value: string): Promise<string> => {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const maskKeyPreview = (rawKey: string): string => {
    if (rawKey.length <= 12) {
      return `${rawKey.slice(0, 4)}••••${rawKey.slice(-2)}`;
    }
    return `${rawKey.slice(0, 10)}••••${rawKey.slice(-4)}`;
  };

  const generateRandomKey = (): string => {
    const chars = 'abcdef0123456789';
    const bytes = new Uint8Array(36);
    crypto.getRandomValues(bytes);
    let randomPart = '';
    for (let i = 0; i < bytes.length; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
    return `xk_live_${randomPart}`;
  };

  const fetchKeysFromRtdb = async (): Promise<ApiKeyItem[]> => {
    const snap = await get(ref(rtdb, 'api_keys'));
    if (!snap.exists()) return [];
    const val = snap.val() || {};
    const list: ApiKeyItem[] = Object.values(val)
      .filter((item: any) => item && item.id && item.keyHash)
      .map((item: any) => ({
        id: item.id,
        name: item.name || 'API Key',
        key: item.key || '',
        keyHash: item.keyHash,
        keyPreview: item.keyPreview || maskKeyPreview(item.key || ''),
        isActive: item.isActive !== false,
        createdAt: item.createdAt || new Date().toISOString(),
        createdBy: item.createdBy || auth.currentUser?.email || 'admin',
        lastUsedAt: item.lastUsedAt || null,
        usageCount: typeof item.usageCount === 'number' ? item.usageCount : 0,
      }));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  };

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/keys', { headers });
      const parsed = await safeParseJson(res);

      if (parsed.isJson) {
        const data = parsed.data;
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Không thể tải danh sách API Key');
        }
        const list: ApiKeyItem[] = Array.isArray(data.keys) ? data.keys : [];
        setKeys(list);
        setCloudSynced(Boolean(data.cloudSynced));
        if (!selectedTestKey && list.length > 0) {
          const active = list.find((k) => k.isActive) || list[0];
          setSelectedTestKey(active.key);
        }
        return;
      }

      // Fallback when static hosting (e.g. Shared App URL) does not mount Node /api routes
      const rtdbList = await fetchKeysFromRtdb();
      setKeys(rtdbList);
      setCloudSynced(true);
      if (!selectedTestKey && rtdbList.length > 0) {
        const active = rtdbList.find((k) => k.isActive) || rtdbList[0];
        setSelectedTestKey(active.key);
      }
    } catch (err: any) {
      const msg = err?.message || 'Lỗi tải API Keys';
      if (msg.toLowerCase().includes('permission')) {
        setErrorMsg(
          'Firebase RTDB chưa mở quyền cho nhánh api_keys. Hãy mở tab "Rules Firebase", sao chép database.rules.json mới dán vào Firebase Console!'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTestKey]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleGenerateRandomPreview = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
    setCustomKeyInput(`xk_live_${randomPart}`);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setErrorMsg('Vui lòng nhập tên gợi nhớ cho API Key.');
      return;
    }
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const trimmedName = newKeyName.trim();
      const trimmedCustom = customKeyInput.trim();
      const headers = await getAdminAuthHeaders();

      let created: ApiKeyItem | null = null;
      let synced = false;

      try {
        const res = await fetch('/api/admin/keys', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: trimmedName,
            customKey: trimmedCustom || undefined,
          }),
        });
        const parsed = await safeParseJson(res);
        if (parsed.isJson) {
          if (!res.ok || !parsed.data?.success) {
            throw new Error(parsed.data?.error || 'Không thể tạo API Key');
          }
          created = parsed.data.key;
          synced = Boolean(parsed.data.cloudSynced);
        }
      } catch (apiErr: any) {
        // Re-throw real backend validation/auth errors; fall back only if fetch/non-JSON
        if (apiErr?.message && !apiErr.message.includes('Failed to fetch')) {
          throw apiErr;
        }
      }

      // Direct Firebase RTDB fallback when /api/admin/keys isn't served (e.g., static Shared App URL)
      if (!created) {
        let finalKey = trimmedCustom;
        if (finalKey) {
          if (finalKey.length < 8 || finalKey.length > 128) {
            throw new Error('API Key tự nhập phải dài từ 8 đến 128 ký tự.');
          }
          if (!/^[a-zA-Z0-9_\-.]+$/.test(finalKey)) {
            throw new Error('API Key chỉ được chứa chữ cái, số, dấu gạch dưới (_), gạch ngang (-) hoặc dấu chấm (.).');
          }
        } else {
          finalKey = generateRandomKey();
        }

        const keyHash = await sha256Hex(finalKey);
        if (keys.some((k) => k.keyHash === keyHash)) {
          throw new Error('API Key này đã tồn tại. Vui lòng chọn key khác.');
        }

        const idBytes = new Uint8Array(6);
        crypto.getRandomValues(idBytes);
        const idHex = Array.from(idBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        created = {
          id: `key_${idHex}`,
          name: trimmedName,
          key: finalKey,
          keyHash,
          keyPreview: maskKeyPreview(finalKey),
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser?.email || 'admin',
          lastUsedAt: null,
          usageCount: 0,
        };

        await set(ref(rtdb, `api_keys/${created.id}`), created);
        await set(ref(rtdb, `api_key_hashes/${created.keyHash}`), {
          id: created.id,
          name: created.name,
          isActive: created.isActive,
          createdAt: created.createdAt,
          createdBy: created.createdBy,
        });
        synced = true;
      }

      setKeys((prev) => [created!, ...prev]);
      setRevealedKeys((prev) => ({ ...prev, [created!.id]: true }));
      setSelectedTestKey(created.key);
      setCloudSynced(synced);
      setNewKeyName('');
      setCustomKeyInput('');
      setSuccessMsg(`Đã tạo API Key "${created.name}" thành công!`);
    } catch (err: any) {
      const msg = err?.message || 'Lỗi tạo API Key';
      if (msg.toLowerCase().includes('permission')) {
        setErrorMsg(
          'Firebase RTDB đang chặn quyền ghi vào nhánh api_keys (PERMISSION_DENIED). Vui lòng mở tab "Rules Firebase" -> sao chép database.rules.json mới dán lên Firebase Console!'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (item: ApiKeyItem) => {
    setBusyKeyId(item.id);
    setErrorMsg(null);
    try {
      const nextActive = !item.isActive;
      const headers = await getAdminAuthHeaders();
      let updated: ApiKeyItem | null = null;

      try {
        const res = await fetch(`/api/admin/keys/${item.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ isActive: nextActive }),
        });
        const parsed = await safeParseJson(res);
        if (parsed.isJson) {
          if (!res.ok || !parsed.data?.success) {
            throw new Error(parsed.data?.error || 'Không thể cập nhật trạng thái API Key');
          }
          updated = parsed.data.key;
        }
      } catch (apiErr: any) {
        if (apiErr?.message && !apiErr.message.includes('Failed to fetch')) {
          throw apiErr;
        }
      }

      if (!updated) {
        updated = { ...item, isActive: nextActive };
        await set(ref(rtdb, `api_keys/${updated.id}`), updated);
        await set(ref(rtdb, `api_key_hashes/${updated.keyHash}`), {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
          createdBy: updated.createdBy,
        });
      }

      setKeys((prev) => prev.map((k) => (k.id === item.id ? updated! : k)));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi cập nhật trạng thái API Key');
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleDeleteKey = async (item: ApiKeyItem) => {
    setBusyKeyId(item.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const headers = await getAdminAuthHeaders();
      let deletedByServer = false;

      try {
        const res = await fetch(`/api/admin/keys/${item.id}`, {
          method: 'DELETE',
          headers,
        });
        const parsed = await safeParseJson(res);
        if (parsed.isJson) {
          if (!res.ok || !parsed.data?.success) {
            throw new Error(parsed.data?.error || 'Không thể xóa API Key');
          }
          deletedByServer = true;
        }
      } catch (apiErr: any) {
        if (apiErr?.message && !apiErr.message.includes('Failed to fetch')) {
          throw apiErr;
        }
      }

      if (!deletedByServer) {
        await remove(ref(rtdb, `api_keys/${item.id}`));
        await remove(ref(rtdb, `api_key_hashes/${item.keyHash}`));
      }

      setKeys((prev) => prev.filter((k) => k.id !== item.id));
      if (selectedTestKey === item.key) {
        setSelectedTestKey('');
      }
      setSuccessMsg(`Đã thu hồi và xóa API Key "${item.name}".`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi xóa API Key');
    } finally {
      setBusyKeyId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runApiTest = async (withKey: boolean) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = {};
      if (withKey && selectedTestKey) {
        headers['x-api-key'] = selectedTestKey;
      }
      if (withKey && includeUserToken && auth.currentUser) {
        const userIdToken = await auth.currentUser.getIdToken();
        if (userIdToken) {
          headers['x-user-token'] = userIdToken;
        }
      }
      const res = await fetch(selectedEndpoint, { headers });
      const text = await res.text();
      let formatted = text;
      let isValidJson = false;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
        isValidJson = true;
      } catch {
        // keep raw
      }
      if (!isValidJson && res.status === 404) {
        formatted = JSON.stringify(
          {
            success: false,
            error:
              'Môi trường preview tĩnh (Shared App URL) không chạy Express Node.js backend cho endpoint /api/v1/*. API Key của bạn vẫn đã được lưu trên Firebase RTDB. Để test endpoint HTTP trực tiếp, hãy mở Development App URL hoặc chạy server Node.js (`npm run dev` / `npm start`).',
            rawResponse: text.slice(0, 120),
          },
          null,
          2
        );
      }
      setTestResult({
        status: res.status,
        ok: res.ok && isValidJson,
        body: formatted,
      });
      if (withKey && res.ok && isValidJson) {
        fetchKeys();
      }
    } catch (err: any) {
      setTestResult({
        status: 0,
        ok: false,
        body: err?.message || 'Lỗi kết nối API',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const activeKeyForSample = selectedTestKey || 'YOUR_API_KEY';

  return (
    <div className="space-y-6">
      {/* Banner explaining API rules */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-600/20 via-[#1b112c] to-emerald-500/10 border border-purple-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-[#c273ed] shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Public API & Quản Lý API Key Riêng
              </h3>
              <p className="text-xs text-white/65">
                Mọi endpoint công khai đều bắt buộc có API Key do bạn tạo mới chạy được.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {cloudSynced !== null && (
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  cloudSynced
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}
              >
                {cloudSynced ? 'Đã đồng bộ Server + Firebase' : 'Đang lưu trực tiếp trên Server'}
              </span>
            )}
            <button
              onClick={fetchKeys}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-black/25 border border-white/10 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Chuẩn ZingMP3 / NCT + Proxy Có Chữ Ký</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                API danh sách trả JSON siêu gọn. Khi phát mới gọi <code className="text-emerald-300">/songs/:id/stream</code> lấy <code className="text-amber-300">streamUrls</code> có chữ ký bảo mật (ẩn link gốc <code className="text-white/80">320/WAV</code>).
              </p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-black/25 border border-white/10 flex items-start gap-2.5">
            <Unlock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">1-Call Trang Chủ & Đồng Bộ Web</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Gọi <code className="text-emerald-300">/api/v1/home</code> 1 lần duy nhất tải toàn bộ trang chủ. Đăng nhập <code className="text-emerald-300">/auth/login</code> để mua bài, tải lossless & đồng bộ cài đặt.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-black/25 border border-white/10 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#c273ed] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Bắt Buộc API Key + Playlist Riêng</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Thiếu key chặn <code className="text-red-300">401/403</code>. Không truyền <code className="text-purple-300">x-user-token</code> sẽ không lộ playlist & cài đặt cá nhân.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create New API Key Form */}
      <form
        onSubmit={handleCreateKey}
        className="p-4 sm:p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#c273ed]" />
            <span>Tạo API Key Mới</span>
          </h4>
          <button
            type="button"
            onClick={handleGenerateRandomPreview}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gợi ý Key Ngẫu Nhiên</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Tên Ứng Dụng / Ghi Chú *
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Ví dụ: App Mobile Flutter, Web Blog Nhạc..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-[#9b4de0]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Key Tự Nhập (Tùy chọn — bỏ trống để tự sinh)
            </label>
            <input
              type="text"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              placeholder="VD: xuanken_secret_2026 (tối thiểu 8 ký tự)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#9b4de0]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreating}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#9b4de0]/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isCreating ? 'Đang tạo API Key...' : 'Tạo API Key Ngay'}</span>
          </button>
        </div>
      </form>

      {/* API Keys List */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Danh Sách API Key Của Bạn ({keys.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-white/50">Đang tải danh sách API Key...</div>
        ) : keys.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-white/15 bg-black/20 space-y-2">
            <KeyRound className="w-8 h-8 text-white/25 mx-auto" />
            <p className="text-xs font-bold text-white/70">Chưa có API Key nào được tạo</p>
            <p className="text-[11px] text-white/45">
              Hiện tại toàn bộ API công khai đang khóa 100%. Hãy tạo 1 API Key ở form bên trên để bắt đầu gọi API.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {keys.map((item) => {
              const isRevealed = Boolean(revealedKeys[item.id]);
              const isBusy = busyKeyId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {item.isActive ? 'Đang hoạt động' : 'Đã tạm khóa'}
                      </span>
                      <span className="text-[11px] text-white/45">
                        • {item.usageCount || 0} lượt gọi
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-purple-200 break-all">
                        {isRevealed ? item.key : item.keyPreview}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedKeys((prev) => ({ ...prev, [item.id]: !isRevealed }))
                        }
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title={isRevealed ? 'Ẩn key' : 'Hiện đầy đủ key'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.key, item.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Đã copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Key</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-white/40">
                      Tạo lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}
                      {item.lastUsedAt
                        ? ` • Gọi gần nhất: ${new Date(item.lastUsedAt).toLocaleString('vi-VN')}`
                        : ''}
                    </p>
                  </div>

                  <div className="w-full lg:w-auto grid grid-cols-2 lg:flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t border-white/5 lg:border-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(item)}
                      className={`justify-center px-3 py-2 lg:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                        item.isActive
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{item.isActive ? 'Tạm Khóa' : 'Kích Hoạt'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteKey(item)}
                      className="justify-center px-3 py-2 lg:py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live API Tester + Docs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Interactive Tester */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Kiểm Tra API Trực Tiếp</span>
          </h4>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/60">Chọn Endpoint</label>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-[#9b4de0]"
              >
                {TEST_ENDPOINTS.map((ep) => (
                  <option key={ep.path} value={ep.path} className="bg-[#170f23]">
                    {ep.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-white/60">Chọn API Key để Test</label>
              <select
                value={selectedTestKey}
                onChange={(e) => setSelectedTestKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#9b4de0]"
              >
                <option value="" className="bg-[#170f23]">
                  -- Chọn API Key --
                </option>
                {keys.map((k) => (
                  <option key={k.id} value={k.key} className="bg-[#170f23]">
                    {k.name} ({k.keyPreview}) {k.isActive ? '' : '[Đang khóa]'}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-white/10 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUserToken}
                onChange={(e) => setIncludeUserToken(e.target.checked)}
                className="w-4 h-4 rounded accent-[#9b4de0]"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Gửi kèm tài khoản Web đang đăng nhập (x-user-token)
                </span>
                <span className="text-[11px] text-white/55">
                  Bật để test mở khóa bài đã mua + playlist cá nhân; tắt để giả lập khách chưa đăng nhập.
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isTesting || !selectedTestKey}
                onClick={() => runApiTest(true)}
                className="justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Chạy Thử (Có Key)</span>
              </button>
              <button
                type="button"
                disabled={isTesting}
                onClick={() => runApiTest(false)}
                className="justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Thử Gọi Không Key (Chặn 401)</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/70">Kết quả trả về:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                    testResult.ok
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  HTTP {testResult.status}
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-purple-200 overflow-auto max-h-72 leading-relaxed">
                {testResult.body}
              </pre>
            </div>
          )}
        </div>

        {/* Code Examples & Endpoint Reference */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#170f23] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#c273ed]" />
              <span>Tài Liệu Tích Hợp App Mobile & Web</span>
            </h4>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  `// 1. Đăng nhập tài khoản chung Web (hoặc bỏ qua nếu chỉ xem khách)\nconst { idToken } = await fetch('${originUrl}/api/v1/auth/login', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'x-api-key': '${activeKeyForSample}' },\n  body: JSON.stringify({ email: 'user@example.com', password: '******' })\n}).then(r => r.json());\n\n// 2. Lấy toàn bộ Trang chủ chỉ với 1 Request (chuẩn ZingMP3/NCT)\nconst home = await fetch('${originUrl}/api/v1/home', {\n  headers: { 'x-api-key': '${activeKeyForSample}', 'x-user-token': idToken }\n}).then(r => r.json());\n\n// 3. Lấy link stream có chữ ký bảo mật khi bấm phát bài\nconst stream = await fetch('${originUrl}/api/v1/songs/SONG_ID/stream', {\n  headers: { 'x-api-key': '${activeKeyForSample}', 'x-user-token': idToken }\n}).then(r => r.json());\n// Phát URL: stream.data.streamUrls.best\n\n// 4. Mua bài hát mới trên App Mobile\nconst buyRes = await fetch('${originUrl}/api/v1/songs/SONG_ID/purchase', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'x-api-key': '${activeKeyForSample}', 'x-user-token': idToken },\n  body: JSON.stringify({ voucherCode: 'XUANKEN50' })\n}).then(r => r.json());`,
                  'sample-fetch'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedId === 'sample-fetch' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Đã copy</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <p className="text-white/70 font-bold">1. Khởi tạo Trang Chủ App Mobile bằng 1 link duy nhất (/home):</p>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`GET ${originUrl}/api/v1/home
Headers: { "x-api-key": "${activeKeyForSample}", "x-user-token": "(tùy chọn)" }
→ Trả về: site, user, featuredAlbums, newReleases, topCharts, weeklyTop, freeSongs, artists, activeVouchers`}
              </pre>
            </div>

            <div className="space-y-1">
              <p className="text-white/70 font-bold">2. Đăng nhập chung Web &amp; lấy Stream URL có chữ ký (320 / WAV):</p>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-amber-200 overflow-x-auto leading-relaxed">
{`POST ${originUrl}/api/v1/auth/login  { email, password }
GET  ${originUrl}/api/v1/songs/:id/stream
→ Trả về streamUrls: { best, demo, mp3_128, mp3_320, wav } (hỗ trợ tua Range)`}
              </pre>
            </div>

            <div className="space-y-1">
              <p className="text-white/70 font-bold">3. Mua bài hát mới trực tiếp từ App Mobile:</p>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-purple-200 overflow-x-auto leading-relaxed">
{`POST ${originUrl}/api/v1/songs/:id/purchase
Headers: { "x-api-key": "${activeKeyForSample}", "x-user-token": userIdToken }
Body:    { "voucherCode": "XUANKEN50" } // Tùy chọn`}
              </pre>
            </div>

            <div className="space-y-1">
              <p className="text-white/70 font-bold">4. Danh sách đầy đủ Endpoints (đã bỏ đăng ký &amp; chat):</p>
              <ul className="space-y-1 text-[11px] text-white/65 font-mono bg-black/30 p-3 rounded-xl border border-white/10 max-h-56 overflow-y-auto">
                <li>• GET  /api/v1/home &amp; GET /api/v1/search?q=...</li>
                <li>• POST /api/v1/auth/login | /auth/refresh</li>
                <li>• GET|PATCH /api/v1/me &amp; GET|PATCH /api/v1/me/settings</li>
                <li>• POST /api/v1/me/likes (song &amp; album) | /me/album-likes</li>
                <li>• GET|POST /api/v1/me/blocks &amp; DELETE /api/v1/me/blocks/:songId</li>
                <li>• GET  /api/v1/songs | /songs/:id | /songs/:id/stream | /songs/:id/download</li>
                <li>• GET  /api/v1/stream/:id (Proxy Range có chữ ký HMAC)</li>
                <li>• POST /api/v1/songs/:id/play &amp; POST /api/v1/songs/:id/report</li>
                <li>• POST /api/v1/songs/:id/purchase &amp; GET|POST /api/v1/purchases</li>
                <li>• GET  /api/v1/vouchers &amp; /vouchers/validate?code=...&amp;songId=...</li>
                <li>• GET|POST /api/v1/playlists &amp; GET|PATCH|DELETE /api/v1/playlists/:id</li>
                <li>• GET  /api/v1/albums | /albums/:id | /artists | /artists/:id | /charts | /site</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

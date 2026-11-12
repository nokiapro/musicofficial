import React, { useState } from 'react';
import {
  Mic2,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  Save,
  X,
  Upload,
  Calendar,
  MapPin,
  Award,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ArtistBio } from '../../types/music';
import { DEFAULT_ARTIST_BIOS } from '../../services/musicService';
import { formatArtistName } from '../../utils/artistUtils';

export const AdminArtistBiosTab: React.FC = () => {
  const {
    artistBios,
    upsertArtistBio,
    deleteArtistBio,
    navigateToArtist,
    songs,
    exclusiveAlbums,
  } = useMusic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [realName, setRealName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hometown, setHometown] = useState('');
  const [genresInput, setGenresInput] = useState('V-Pop, R&B');
  const [debutYear, setDebutYear] = useState('2020');
  const [bio, setBio] = useState('');
  const [achievementsInput, setAchievementsInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setRealName('');
    setAvatarUrl('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80');
    setBannerUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80');
    setBirthDate('');
    setHometown('');
    setGenresInput('V-Pop');
    setDebutYear('2024');
    setBio('');
    setAchievementsInput('');
    setYoutubeUrl('');
    setFacebookUrl('');
    setTiktokUrl('');
    setInstagramUrl('');
    setIsVerified(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (artist: ArtistBio) => {
    setEditingId(artist.id);
    setName(artist.name);
    setRealName(artist.realName || '');
    setAvatarUrl(artist.avatarUrl || '');
    setBannerUrl(artist.bannerUrl || '');
    setBirthDate(artist.birthDate || '');
    setHometown(artist.hometown || '');
    setGenresInput((artist.genres || []).join(', '));
    setDebutYear(artist.debutYear || '');
    setBio(artist.bio || '');
    setAchievementsInput((artist.achievements || []).join('\n'));
    setYoutubeUrl(artist.socialLinks?.youtube || '');
    setFacebookUrl(artist.socialLinks?.facebook || '');
    setTiktokUrl(artist.socialLinks?.tiktok || '');
    setInstagramUrl(artist.socialLinks?.instagram || '');
    setIsVerified(Boolean(artist.isVerified));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setStatusMsg(null);

    const genres = genresInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const achievements = achievementsInput
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const newBio: ArtistBio = {
      id: editingId || `art-${Date.now()}`,
      name: name.trim(),
      realName: realName.trim() || undefined,
      avatarUrl:
        avatarUrl.trim() ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      bannerUrl: bannerUrl.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      hometown: hometown.trim() || undefined,
      genres: genres.length > 0 ? genres : ['V-Pop'],
      debutYear: debutYear.trim() || undefined,
      bio: bio.trim() || `${name.trim()} là ca sĩ trên XuanKen Music.`,
      achievements: achievements.length > 0 ? achievements : undefined,
      isVerified: Boolean(isVerified),
      socialLinks: {
        youtube: youtubeUrl.trim() || undefined,
        facebook: facebookUrl.trim() || undefined,
        tiktok: tiktokUrl.trim() || undefined,
        instagram: instagramUrl.trim() || undefined,
      },
    };

    try {
      await upsertArtistBio(newBio);
      setStatusMsg({ text: `Đã lưu tiểu sử nghệ sĩ "${newBio.name}" thành công!` });
      setIsModalOpen(false);
    } catch (err: any) {
      setStatusMsg({ text: `Lỗi khi lưu: ${err?.message || 'Không xác định'}`, error: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, artistName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tiểu sử của ca sĩ "${artistName}"?`)) {
      return;
    }
    try {
      await deleteArtistBio(id);
      setStatusMsg({ text: `Đã xóa tiểu sử ca sĩ "${artistName}"!` });
    } catch (err: any) {
      setStatusMsg({ text: `Lỗi khi xóa: ${err?.message}`, error: true });
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        'Bạn có muốn nạp lại danh sách 9 ca sĩ mẫu nổi tiếng (XuanKen, Sơn Tùng, JustaTee, Đen Vâu, Vũ., Soobin, Hoàng Thùy Linh, Amee, Jack)?'
      )
    ) {
      return;
    }
    setIsSaving(true);
    for (const b of DEFAULT_ARTIST_BIOS) {
      await upsertArtistBio(b);
    }
    setIsSaving(false);
    setStatusMsg({ text: 'Đã nạp thành công 9 ca sĩ mẫu!' });
  };

  const getSongCountForArtist = (artistName: string) => {
    const q = artistName.toLowerCase().trim();
    let count = 0;
    songs.forEach((s) => {
      if (s.artists && s.artists.toLowerCase().includes(q)) count++;
    });
    exclusiveAlbums.forEach((alb) => {
      (alb.songs || []).forEach((as) => {
        if (as.artists && as.artists.toLowerCase().includes(q)) count++;
      });
    });
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Quản Lý Ca Sĩ & Tiểu Sử ({artistBios.length} nghệ sĩ)
            </h3>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Chỉnh sửa tiểu sử, ảnh đại diện, ngày sinh, quê quán, dòng nhạc và thành tích của từng ca sĩ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            title="Nạp lại danh sách nghệ sĩ mẫu nổi tiếng"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Nạp 9 Ca Sĩ Mẫu</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Ca Sĩ Mới</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            statusMsg.error
              ? 'bg-red-500/20 border border-red-500/40 text-red-300'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Artists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {artistBios.map((artist) => {
          const songCount = getSongCountForArtist(artist.name);

          return (
            <div
              key={artist.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all shadow-md"
            >
              <div className="space-y-3">
                {/* Header: Avatar + Info */}
                <div className="flex items-start gap-3">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-purple-400/40 shrink-0 shadow-md">
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">{formatArtistName(artist.name)}</h4>
                      {artist.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-wider uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>ĐÃ XÁC MINH</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-white/40 border border-white/10 px-1.5 py-0.5 rounded-full bg-white/5">
                          Chưa xác minh
                        </span>
                      )}
                    </div>
                    {artist.realName && (
                      <p className="text-[11px] text-white/50 truncate">Tên thật: {artist.realName}</p>
                    )}
                    <p className="text-[11px] font-semibold text-purple-300 mt-0.5">
                      {songCount} bài hát trong thư viện
                    </p>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-white/60">
                  {artist.hometown && (
                    <span className="flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-md">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>{artist.hometown}</span>
                    </span>
                  )}
                  {artist.debutYear && (
                    <span className="flex items-center gap-0.5 bg-white/5 px-2 py-0.5 rounded-md">
                      <Award className="w-3 h-3 text-purple-400" />
                      <span>Năm {artist.debutYear}</span>
                    </span>
                  )}
                  {artist.genres && artist.genres[0] && (
                    <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-md font-medium">
                      {artist.genres[0]}
                    </span>
                  )}
                </div>

                {/* Brief bio preview */}
                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                  {artist.bio}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigateToArtist(artist.name)}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem hồ sơ</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(artist)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    title="Chỉnh sửa tiểu sử"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(artist.id, artist.name)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                    title="Xóa nghệ sĩ này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Artist Bio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#170f23] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold">
                  {editingId ? 'Chỉnh Sửa Tiểu Sử Nghệ Sĩ' : 'Thêm Nghệ Sĩ Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              {/* Row 1: Stage name & Real name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1">Nghệ danh (*)</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Sơn Tùng M-TP"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1">Tên thật (khai sinh)</label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="VD: Nguyễn Thanh Tùng"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Verification Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-black/40 border-white/20 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-white font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Nghệ Sĩ Đã Xác Minh (Hiển thị badge xanh "ĐÃ XÁC MINH")</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Tích chọn để cấp huy hiệu xác minh chính thức cho nghệ sĩ này.
                  </p>
                </div>
              </label>

              {/* Row 2: Avatar URL & Banner URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1">Link Ảnh Avatar Chân Dung (*)</label>
                  <input
                    type="url"
                    required
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                  {avatarUrl && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-[10px] text-white/40">Xem trước ảnh đại diện</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">Link Ảnh Bìa / Sân Khấu</label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 3: BirthDate, Hometown, DebutYear, Genres */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-white/80 font-bold mb-1">Ngày sinh</label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="VD: 05/07/1994"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1">Quê quán</label>
                  <input
                    type="text"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                    placeholder="VD: Thái Bình"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1">Năm ra mắt</label>
                  <input
                    type="text"
                    value={debutYear}
                    onChange={(e) => setDebutYear(e.target.value)}
                    placeholder="VD: 2012"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-1">Dòng nhạc (cách dấu phẩy)</label>
                  <input
                    type="text"
                    value={genresInput}
                    onChange={(e) => setGenresInput(e.target.value)}
                    placeholder="V-Pop, R&B"
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Bio Narrative */}
              <div>
                <label className="block text-white/80 font-bold mb-1">
                  Tiểu Sử & Câu Chuyện Sự Nghiệp (*)
                </label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Viết chi tiết về cuộc đời, phong cách âm nhạc và con đường nghệ thuật của ca sĩ..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Achievements (1 per line) */}
              <div>
                <label className="block text-white/80 font-bold mb-1">
                  Thành Tích & Dấu Ấn Tiêu Biểu (Mỗi dòng 1 thành tích)
                </label>
                <textarea
                  rows={3}
                  value={achievementsInput}
                  onChange={(e) => setAchievementsInput(e.target.value)}
                  placeholder="Ví dụ:&#10;Giải thưởng Ca sĩ của năm&#10;Hơn 100M views trên YouTube"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block text-white/80 font-bold">Kênh Mạng Xã Hội Trực Tuyến</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Link kênh YouTube..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="Link trang Facebook..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="Link kênh TikTok..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="Link tài khoản Instagram..."
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-[11px]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Tiểu Sử'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

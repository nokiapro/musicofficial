import { useEffect, useRef, RefObject } from 'react';

export function scrollToSongElement(
  container: HTMLElement | null,
  songId?: string | null
): boolean {
  if (!container || !songId) return false;
  const rows = container.querySelectorAll<HTMLElement>('[data-song-id]');
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].getAttribute('data-song-id') === songId) {
      rows[i].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      return true;
    }
  }
  return false;
}

interface UseAutoScrollToSongOptions<T extends { id: string }> {
  containerRef: RefObject<HTMLElement | null>;
  songId?: string | null;
  enabled?: boolean;
  /** View identifier so switching tabs/albums/playlists scrolls once to active track */
  viewKey?: string | number | null;
  /** Full ordered list for paginated views so page switches automatically when song changes */
  paginatedList?: T[];
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  /** Optional counter to force re-scroll (e.g. clicking Random when picking within a 1-song list) */
  manualTrigger?: number;
  /** Optional item count so async initial data load still scrolls once populated */
  itemCount?: number;
}

export function useAutoScrollToSong<T extends { id: string }>({
  containerRef,
  songId,
  enabled = true,
  viewKey = '',
  paginatedList,
  pageSize = 20,
  currentPage = 1,
  onPageChange,
  manualTrigger = 0,
  itemCount,
}: UseAutoScrollToSongOptions<T>) {
  const lastScrolledSignatureRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Keep latest pagination/list props in refs so manual page clicks never re-trigger auto-scroll
  const latestRef = useRef({
    paginatedList,
    pageSize,
    currentPage,
    onPageChange,
  });
  latestRef.current = {
    paginatedList,
    pageSize,
    currentPage,
    onPageChange,
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const effectiveCount =
    itemCount !== undefined ? itemCount : paginatedList ? paginatedList.length : undefined;

  useEffect(() => {
    if (!enabled || !songId) {
      if (!enabled) {
        lastScrolledSignatureRef.current = null;
      }
      return;
    }

    // Wait until list data is loaded if count is known to be 0
    if (effectiveCount !== undefined && effectiveCount === 0) {
      return;
    }

    const signature = `${viewKey ?? ''}|${songId}|${manualTrigger}`;
    if (lastScrolledSignatureRef.current === signature) {
      return;
    }

    const {
      paginatedList: list,
      pageSize: size,
      currentPage: page,
      onPageChange: setPage,
    } = latestRef.current;

    if (list && setPage && size > 0) {
      const idx = list.findIndex((item) => item.id === songId);
      if (idx === -1) {
        lastScrolledSignatureRef.current = signature;
        return;
      }

      const targetPage = Math.floor(idx / size) + 1;
      lastScrolledSignatureRef.current = signature;

      if (page !== targetPage) {
        setPage(targetPage);
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          scrollToSongElement(containerRef.current, songId);
          timerRef.current = null;
        }, 90);
        return;
      }
    } else {
      lastScrolledSignatureRef.current = signature;
    }

    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      scrollToSongElement(containerRef.current, songId);
      timerRef.current = null;
    }, 50);
  }, [enabled, songId, viewKey, manualTrigger, effectiveCount, containerRef]);
}

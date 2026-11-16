import { useEffect, useRef, useState } from 'react';

/**
 * Manages mount/unmount presence for modals, drawers, and bottom sheets so that
 * closing triggers exit animations before DOM removal — even when closed externally.
 */
export function useAnimatedPresence(isOpen: boolean, durationMs: number = 220) {
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      timerRef.current = window.setTimeout(() => {
        setShouldRender(false);
        timerRef.current = null;
      }, durationMs);
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, durationMs, shouldRender]);

  const effectiveRender = isOpen || shouldRender;
  const isClosing = !isOpen && shouldRender;

  return { shouldRender: effectiveRender, isClosing };
}

/**
 * Retains the latest non-null payload while a modal plays its exit animation.
 */
export function useAnimatedData<T>(data: T | null | undefined, durationMs: number = 220) {
  const isOpen = Boolean(data);
  const { shouldRender, isClosing } = useAnimatedPresence(isOpen, durationMs);
  const lastValidRef = useRef<T | null>(data ?? null);

  if (data) {
    lastValidRef.current = data;
  } else if (!shouldRender) {
    lastValidRef.current = null;
  }

  const activeData = data ?? (shouldRender ? lastValidRef.current : null);

  return {
    activeData,
    shouldRender: shouldRender && Boolean(activeData),
    isClosing,
  };
}

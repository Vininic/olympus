import { useCallback, useEffect, useRef } from "react";

interface Options {
  minHeight?: number;
  maxHeight?: number;
}

/** Grows a textarea with its content between two bounds, then scrolls.
 *  Same contract as kokonutui's hook of the same name (72 → 300px defaults),
 *  reimplemented here so the composer does not drag an animation library in
 *  for what is four lines of layout math. */
export function useAutoResizeTextarea({ minHeight = 72, maxHeight = 300 }: Options = {}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((reset = false) => {
    const el = textareaRef.current;
    if (!el) return;
    if (reset) {
      el.style.height = `${minHeight}px`;
      return;
    }
    // Collapse first: without this the scrollHeight only ever grows.
    el.style.height = "auto";
    const next = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  useEffect(() => { adjustHeight(true); }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

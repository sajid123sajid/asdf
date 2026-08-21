import { useEffect, useState } from "react";

/**
 * Returns true when the user is scrolling down past `threshold`, false when
 * scrolling back up or near the top.
 *
 * Direction changes are only committed after `travel` pixels in the new
 * direction. That keeps small layout-driven scroll adjustments (image loading,
 * the header itself collapsing and shortening the document) from flipping the
 * state back and forth, which would look like flickering.
 */
export function useHideOnScroll(threshold = 60, travel = 48) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let acc = 0;
    let frame = 0;
    // ignore scroll adjustments the browser makes right after we collapse or
    // expand the header (the document height changes, which can nudge scrollY)
    let lockUntil = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const diff = y - last;
      last = y;

      if (performance.now() < lockUntil) return;

      if (y <= threshold) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(false);
        return;
      }

      if (diff === 0) return;
      // reset the accumulator whenever the direction changes
      if ((acc > 0 && diff < 0) || (acc < 0 && diff > 0)) acc = 0;
      acc += diff;

      if (acc > travel) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(true);
      } else if (acc < -travel) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(false);
      }
    };


    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold, travel]);

  return hidden;
}

/**
 * Returns `offset` when the user is scrolling down past `threshold`, or 0 when
 * scrolling back up or near the top. Direction changes are only committed after
 * `travel` pixels to avoid flicker during slow scrolling. Useful for moving a
 * mobile bottom group down slightly without fully hiding it.
 */
export function usePartialHideOnScroll(offset = 40, threshold = 60, travel = 40) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let acc = 0;
    let frame = 0;
    let lockUntil = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const diff = y - last;
      last = y;

      if (performance.now() < lockUntil) return;

      if (y <= threshold) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(false);
        return;
      }

      if (diff === 0) return;
      if ((acc > 0 && diff < 0) || (acc < 0 && diff > 0)) acc = 0;
      acc += diff;

      if (acc > travel) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(true);
      } else if (acc < -travel) {
        acc = 0;
        lockUntil = performance.now() + 400;
        setHidden(false);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [offset, threshold, travel]);

  return hidden ? offset : 0;
}

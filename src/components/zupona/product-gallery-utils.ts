export type GallerySlide = {
  type: "image" | "video";
  src: string;
  alt: string;
};

export function mergeProductMediaItems(images: string[], video?: string): GallerySlide[] {
  const cleanedImages = Array.from(new Set(images.filter(Boolean).map((src) => src.trim()).filter(Boolean)));
  const videoSrc = video?.trim();

  if (!cleanedImages.length && !videoSrc) return [];
  if (!videoSrc) {
    return cleanedImages.map((src, index) => ({
      type: "image",
      src,
      alt: `Product media ${index + 1}`,
    }));
  }

  const hasVideoAlready = cleanedImages.some((src) => src === videoSrc);
  if (hasVideoAlready) {
    return cleanedImages.map((src, index) => ({
      type: src === videoSrc ? "video" : "image",
      src,
      alt: src === videoSrc ? "Product video" : `Product media ${index + 1}`,
    }));
  }

  const merged: GallerySlide[] = cleanedImages.map((src, index) => ({
    type: "image",
    src,
    alt: `Product media ${index + 1}`,
  }));

  const insertAt = Math.min(Math.max(1, merged.length > 0 ? 1 : 0), merged.length || 1);
  merged.splice(insertAt, 0, {
    type: "video",
    src: videoSrc,
    alt: "Product video",
  });

  return merged;
}

export function buildGallerySlides(images: string[], alt: string, video?: string): GallerySlide[] {
  const slides = mergeProductMediaItems(images, video);
  return slides.map((slide, index) => ({
    ...slide,
    alt: slide.type === "video" ? `${alt} — product video` : `${alt} — image ${index + 1}`,
  }));
}

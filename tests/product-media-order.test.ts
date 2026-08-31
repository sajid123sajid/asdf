import assert from "node:assert/strict";
import test from "node:test";

import { mergeProductMediaItems } from "../src/components/zupona/ProductGallery.tsx";

test("preserves product media order when a video sits between images", () => {
  const ordered = mergeProductMediaItems(
    [
      "https://cdn.example.com/img-1.jpg",
      "https://cdn.example.com/video-1.mp4",
      "https://cdn.example.com/img-2.jpg",
      "https://cdn.example.com/img-3.jpg",
    ],
    "https://cdn.example.com/video-1.mp4",
  );

  assert.deepEqual(ordered, [
    { type: "image", src: "https://cdn.example.com/img-1.jpg", alt: "Product media 1" },
    { type: "video", src: "https://cdn.example.com/video-1.mp4", alt: "Product video" },
    { type: "image", src: "https://cdn.example.com/img-2.jpg", alt: "Product media 3" },
    { type: "image", src: "https://cdn.example.com/img-3.jpg", alt: "Product media 4" },
  ]);
});

test("keeps a standalone product video as the only media when no images exist", () => {
  const ordered = mergeProductMediaItems([], "https://cdn.example.com/product-video.mp4");

  assert.deepEqual(ordered, [{ type: "video", src: "https://cdn.example.com/product-video.mp4", alt: "Product video" }]);
});

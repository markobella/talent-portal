export const MAX_GALLERY_ITEMS = 10;
export const MAX_PHOTO_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

export const GALLERY_MEDIA_DB_TYPES = ["GALLERY_PHOTO", "GALLERY_VIDEO"] as const;

export type GalleryMediaDbType = (typeof GALLERY_MEDIA_DB_TYPES)[number];
export type GalleryMediaKind = "PHOTO" | "VIDEO";

export const GALLERY_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const GALLERY_FILE_INPUT_ACCEPT = "image/*,video/mp4,video/webm,video/quicktime,.mov";

export function isGalleryMediaDbType(value: string | null | undefined): value is GalleryMediaDbType {
  return !!value && (GALLERY_MEDIA_DB_TYPES as readonly string[]).includes(value);
}

export function isSupportedGalleryVideoMimeType(mimeType: string | null | undefined) {
  if (!mimeType) return false;
  const value = mimeType.trim().toLowerCase();
  return (GALLERY_VIDEO_MIME_TYPES as readonly string[]).includes(value);
}

export function galleryKindFromMimeType(mimeType: string | null | undefined): GalleryMediaKind | null {
  if (!mimeType) return null;
  const value = mimeType.trim().toLowerCase();
  if (value.startsWith("image/")) return "PHOTO";
  if (isSupportedGalleryVideoMimeType(value)) return "VIDEO";
  return null;
}

export function galleryKindFromDbType(type: string | null | undefined, mimeType?: string | null): GalleryMediaKind {
  if (type === "GALLERY_VIDEO") return "VIDEO";
  if (type === "GALLERY_PHOTO") return "PHOTO";
  return galleryKindFromMimeType(mimeType) === "VIDEO" ? "VIDEO" : "PHOTO";
}

export function galleryDbTypeFromKind(kind: GalleryMediaKind): GalleryMediaDbType {
  return kind === "VIDEO" ? "GALLERY_VIDEO" : "GALLERY_PHOTO";
}

export function maxGalleryUploadBytesForKind(kind: GalleryMediaKind) {
  return kind === "VIDEO" ? MAX_VIDEO_UPLOAD_BYTES : MAX_PHOTO_UPLOAD_BYTES;
}

export function galleryKindLabel(kind: GalleryMediaKind, count = 1) {
  const noun = kind === "VIDEO" ? "video" : "photo";
  return count === 1 ? noun : `${noun}s`;
}

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'tiff',
];

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg'];

export function isImage(protectedDataName: string) {
  return IMAGE_EXTENSIONS.some((ext) =>
    protectedDataName.toLowerCase().endsWith(ext)
  );
}

export function isVideo(protectedDataName: string) {
  return VIDEO_EXTENSIONS.some((ext) =>
    protectedDataName.toLowerCase().endsWith(ext)
  );
}

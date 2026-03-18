export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .toLowerCase()
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '-');
};

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/webm',
  'audio/ogg',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return { valid: false, error: "Formato não suportado. Use MP3, WAV, M4A ou WebM." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "O arquivo é muito grande. O limite é de 50MB." };
  }
  return { valid: true };
};
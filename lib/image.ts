export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 512;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

export type AvatarFileInfo = { type: string; size: number };

export function validateAvatarFile(file: AvatarFileInfo): string | null {
  if (file.size === 0) return "Arquivo vazio. Selecione outra imagem.";
  if (!ACCEPTED_TYPES.has(file.type.toLowerCase())) {
    return "Formato não suportado. Use JPG, PNG, WebP ou GIF.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return `Imagem muito grande (${formatBytes(file.size)}). O limite é 10MB.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extensionForType(type: string): string {
  return EXTENSION_BY_TYPE[type.toLowerCase()] ?? "jpg";
}

export function scaleToFit(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const largest = Math.max(width, height);
  if (largest <= max) return { width, height };
  const ratio = max / largest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export type PreparedAvatar = { blob: Blob; contentType: string; extension: string };

/**
 * Downscales an avatar in the browser so multi-megabyte phone photos become a
 * small upload. Falls back to the original file when the browser cannot decode
 * or re-encode it (e.g. HEIC without native support).
 */
export async function prepareAvatarImage(file: File): Promise<PreparedAvatar> {
  const fallback: PreparedAvatar = {
    blob: file,
    contentType: file.type || "image/jpeg",
    extension: extensionForType(file.type || "image/jpeg"),
  };

  if (typeof document === "undefined") return fallback;

  try {
    const source = await decodeImage(file);
    const { width, height } = scaleToFit(
      source.width,
      source.height,
      AVATAR_MAX_DIMENSION,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;

    const contentType = supportsWebp() ? "image/webp" : "image/jpeg";
    if (contentType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(source, 0, 0, width, height);
    if ("close" in source) source.close();

    const blob = await canvasToBlob(canvas, contentType, 0.85);
    if (!blob || blob.size === 0) return fallback;

    return { blob, contentType, extension: extensionForType(contentType) };
  } catch {
    return fallback;
  }
}

async function decodeImage(
  file: File,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // Fall through to the <img> decoder below.
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode-failed"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    webpSupport = probe.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

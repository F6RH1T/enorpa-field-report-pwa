// Seçilen fotoğrafları her tarayıcıda görüntülenebilir JPEG'e çevirir.
// iPhone/Mac fotoğrafları çoğunlukla HEIC formatındadır; Chrome bu formatı
// gösteremediği için önizleme ve PDF'te kırık resim çıkıyordu.

export type Photo = { id: string; file: File; url: string };

const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;
const HEIC_LIB = 'https://cdn.jsdelivr.net/npm/heic-to@1.6.6/dist/iife/heic-to.js';

type HeicToFn = ((o: { blob: Blob; type: string; quality?: number }) => Promise<Blob>) & {
  isHeic?: (b: Blob) => Promise<boolean>;
};

export const isImageFile = (f: File) =>
  f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name);

const looksHeic = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve(img);
      else reject(new Error('empty image'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode failed'));
    };
    img.src = url;
  });
}

let heicLoader: Promise<HeicToFn> | null = null;
function loadHeicConverter(): Promise<HeicToFn> {
  const w = window as unknown as { HeicTo?: HeicToFn };
  if (w.HeicTo) return Promise.resolve(w.HeicTo);
  if (!heicLoader) {
    heicLoader = new Promise<HeicToFn>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = HEIC_LIB;
      s.async = true;
      s.onload = () => (w.HeicTo ? resolve(w.HeicTo) : reject(new Error('HeicTo missing')));
      s.onerror = () => reject(new Error('HEIC converter could not be loaded'));
      document.head.appendChild(s);
    }).catch((err) => {
      heicLoader = null; // internet gelince tekrar denenebilsin
      throw err;
    });
  }
  return heicLoader;
}

async function toJpeg(img: HTMLImageElement): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('jpeg encode failed');
  return blob;
}

/** Dosyayı tarayıcının gösterebildiği, küçültülmüş bir JPEG'e çevirir. Gösterilemiyorsa hata fırlatır. */
export async function preparePhoto(file: File): Promise<File> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    // Tarayıcı açamadı: HEIC ise dönüştürücüyü yükleyip tekrar dene
    let heicTo: HeicToFn;
    try {
      heicTo = await loadHeicConverter();
    } catch {
      throw new Error(looksHeic(file) ? 'heic-offline' : 'unsupported');
    }
    const heic = looksHeic(file) || (heicTo.isHeic ? await heicTo.isHeic(file).catch(() => false) : false);
    if (!heic) throw new Error('unsupported');
    const converted = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
    img = await loadImage(converted);
  }
  const jpeg = await toJpeg(img);
  const name = (file.name.replace(/\.[^.]+$/, '') || 'saha-fotografi') + '.jpg';
  return new File([jpeg], name, { type: 'image/jpeg', lastModified: file.lastModified || Date.now() });
}

let seq = 0;
export const makePhoto = (file: File): Photo => ({
  id: `${Date.now().toString(36)}-${(seq++).toString(36)}`,
  file,
  url: URL.createObjectURL(file),
});

import logo from "@/assets/logo.png";

/**
 * The brand mark for the PDF masthead. jsPDF needs pixel data, not a URL, so the
 * bundled asset is fetched once per session and memoised as a data URL —
 * including the failure, so a blocked fetch is not retried on every export.
 * A missing logo degrades to a wordmark-only header rather than failing the
 * download.
 */

let cached: string | null | undefined;

export const LOGO_ASPECT_RATIO = logo.width / logo.height;

export const loadLogoDataUrl = async (): Promise<string | null> => {
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(logo.src);
    if (!response.ok) throw new Error(`logo fetch failed: ${response.status}`);
    const blob = await response.blob();
    cached = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    cached = null;
  }

  return cached;
};

// Spoiler-light result sharing. Uses the Web Share sheet on device, falling back
// to clipboard on the web. Never reveals the scene image, only the result.

export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ text });
      return 'shared';
    }
  } catch {
    return 'failed';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

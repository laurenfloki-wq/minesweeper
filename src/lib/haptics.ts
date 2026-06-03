// Thin wrapper around @capacitor/haptics. Dynamically imported so the web
// build and browser preview run without a native runtime present.

type ImpactStyle = 'Light' | 'Medium' | 'Heavy';

let hapticsModule: typeof import('@capacitor/haptics') | null | undefined;

async function getHaptics() {
  if (hapticsModule !== undefined) return hapticsModule;
  try {
    hapticsModule = await import('@capacitor/haptics');
  } catch {
    hapticsModule = null;
  }
  return hapticsModule;
}

export async function impact(style: ImpactStyle = 'Light') {
  const mod = await getHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.impact({ style: mod.ImpactStyle[style] });
  } catch {
    // Not running on a device; ignore.
  }
}

export async function notifyLoss() {
  const mod = await getHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.notification({ type: mod.NotificationType.Error });
  } catch {
    // ignore
  }
}

export async function notifyWin() {
  const mod = await getHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.notification({ type: mod.NotificationType.Success });
  } catch {
    // ignore
  }
}

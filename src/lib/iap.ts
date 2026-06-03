// In-app purchases (cosmetic only: theme packs + a one-time remove-ads).
// Web build uses a stub that grants instantly so the flows are testable. On
// device, wire RevenueCat (recommended for cross-store) or
// @capacitor-community/in-app-purchases. No pay-to-win is ever sold here.

import { getSettings, saveSettings } from './storage';

export interface Product {
  id: string;
  title: string;
  price: string; // display string; the store is the source of truth on device
  kind: 'remove-ads' | 'theme';
}

export const PRODUCTS: Product[] = [
  { id: 'remove_ads', title: 'Remove ads', price: '$3.99', kind: 'remove-ads' },
  { id: 'theme_meadow', title: 'Meadow theme pack', price: '$1.99', kind: 'theme' },
  { id: 'theme_dusk', title: 'Dusk theme pack', price: '$1.99', kind: 'theme' },
];

export function isOwned(productId: string): boolean {
  const s = getSettings();
  if (productId === 'remove_ads') return s.adsRemoved;
  return s.ownedThemes.includes(productId);
}

// Returns true if the purchase succeeded (or was already owned).
export async function purchase(productId: string): Promise<boolean> {
  if (isOwned(productId)) return true;
  const ok = await nativeStore.buy(productId);
  if (!ok) return false;
  if (productId === 'remove_ads') saveSettings({ adsRemoved: true });
  else {
    const owned = getSettings().ownedThemes;
    saveSettings({ ownedThemes: [...owned, productId] });
  }
  return true;
}

export async function restorePurchases(): Promise<void> {
  await nativeStore.restore();
}

// ---- Native adapter ----------------------------------------------------------
interface StoreAdapter {
  buy(productId: string): Promise<boolean>;
  restore(): Promise<void>;
}

const stubStore: StoreAdapter = {
  async buy() {
    await new Promise((r) => setTimeout(r, 400));
    return true; // dev build: always "succeeds"
  },
  async restore() {
    /* no-op in dev */
  },
};

// On device, replace with RevenueCat:
//   import { Purchases } from '@revenuecat/purchases-capacitor';
//   await Purchases.configure({ apiKey: RC_KEY });
//   buy(id) -> Purchases.purchaseStoreProduct(...)
//   restore() -> Purchases.restorePurchases()
const nativeStore: StoreAdapter = stubStore;

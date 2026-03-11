export type PharmacyCartItem = {
  id: string;
  uuid: string;
  name: string;
  price: number;
  quantity: number;
  pharmacyId: string;
  pharmacyName: string;
  image?: string | null;
};

const STORAGE_KEY = "vetlink:pharmacyCart:v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadPharmacyCart(): PharmacyCartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as PharmacyCartItem[];
  } catch {
    return [];
  }
}

export function savePharmacyCart(cart: PharmacyCartItem[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota/serialization issues
  }
}

export function clearPharmacyCart() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function addItemToPharmacyCart(
  cart: PharmacyCartItem[],
  product: any,
): PharmacyCartItem[] {
  if (!product || !product.id || !product.pharmacyId) return cart;
  if (product.stock != null && Number(product.stock) <= 0) return cart;

  const id = String(product.id);
  const pharmacyId = String(product.pharmacyId);

  const existing = cart.find((i) => i.id === id && i.pharmacyId === pharmacyId);
  if (existing) {
    return cart.map((i) =>
      i.id === id && i.pharmacyId === pharmacyId
        ? { ...i, quantity: i.quantity + 1 }
        : i,
    );
  }

  return [
    ...cart,
    {
      id,
      uuid: String(product.uuid || product.id),
      name: String(product.name || ""),
      price: Number(product.price) || 0,
      quantity: 1,
      pharmacyId,
      pharmacyName: String(product.pharmacyName || ""),
      image: product.image || null,
    },
  ];
}

export function removeItemFromPharmacyCart(
  cart: PharmacyCartItem[],
  productId: string,
  pharmacyId: string,
): PharmacyCartItem[] {
  return cart.filter(
    (i) => !(i.id === productId && i.pharmacyId === pharmacyId),
  );
}

export function updatePharmacyCartQuantity(
  cart: PharmacyCartItem[],
  productId: string,
  pharmacyId: string,
  delta: number,
): PharmacyCartItem[] {
  return cart
    .map((i) => {
      if (i.id === productId && i.pharmacyId === pharmacyId) {
        const quantity = i.quantity + delta;
        if (quantity <= 0) return null;
        return { ...i, quantity };
      }
      return i;
    })
    .filter(Boolean) as PharmacyCartItem[];
}

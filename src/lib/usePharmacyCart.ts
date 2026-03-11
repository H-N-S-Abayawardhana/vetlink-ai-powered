"use client";

import { useCallback, useEffect, useState } from "react";
import type { SetStateAction } from "react";
import {
  loadPharmacyCart,
  savePharmacyCart,
  subscribeToPharmacyCart,
  type PharmacyCartItem,
} from "@/lib/pharmacyCart";

export function usePharmacyCart() {
  const [cart, setCartState] = useState<PharmacyCartItem[]>([]);

  useEffect(() => {
    setCartState(loadPharmacyCart());
    return subscribeToPharmacyCart(setCartState);
  }, []);

  const setCart = useCallback((value: SetStateAction<PharmacyCartItem[]>) => {
    const nextCart =
      typeof value === "function"
        ? (value as (prevState: PharmacyCartItem[]) => PharmacyCartItem[])(
            loadPharmacyCart(),
          )
        : value;

    setCartState(nextCart);
    savePharmacyCart(nextCart);
  }, []);

  return { cart, setCart };
}

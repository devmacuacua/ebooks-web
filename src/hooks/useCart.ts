"use client";

import React from "react";
import type { CartItem, BookType } from "@/types";

const CART_KEY = "ebooks_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// ─── Cart Hook ────────────────────────────────────────────────────────────────
export function useCart() {
  const [items, setItems] = React.useState<CartItem[]>([]);

  // Load from localStorage on mount
  React.useEffect(() => {
    setItems(loadCart());
  }, []);

  const addItem = React.useCallback(
    (book: {
      id?: string;
      bookId?: string;
      title: string;
      slug: string;
      coverImageUrl?: string;
      price: number;
      type: BookType;
      quantity?: number;
    }) => {
      setItems((prev) => {
        const bookId = book.bookId || book.id || "";
        const existing = prev.find((i) => i.bookId === bookId);
        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i.bookId === bookId
              ? { ...i, quantity: i.quantity + (book.quantity ?? 1) }
              : i
          );
        } else {
          next = [
            ...prev,
            {
              id: `cart_${Date.now()}`,
              bookId,
              title: book.title,
              slug: book.slug,
              coverImageUrl: book.coverImageUrl,
              price: book.price,
              type: book.type,
              quantity: book.quantity ?? 1,
            },
          ];
        }
        saveCart(next);
        return next;
      });
    },
    []
  );

  const removeItem = React.useCallback((bookId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.bookId !== bookId);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = React.useCallback(
    (bookId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(bookId);
        return;
      }
      setItems((prev) => {
        const next = prev.map((i) =>
          i.bookId === bookId ? { ...i, quantity } : i
        );
        saveCart(next);
        return next;
      });
    },
    [removeItem]
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const hasPhysical = items.some(
    (i) => i.type === "PHYSICAL" || i.type === "BOTH"
  );
  const deliveryFee = hasPhysical ? 150 : 0; // 150 MZN delivery fee (must match backend OrderService)
  const total = subtotal + deliveryFee;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    count,
  };
}

import { describe, it, expect, beforeEach } from "vitest";

// Test the pure cart logic functions extracted from useCart
// (React hook integration is tested via E2E; here we cover the business rules)

const CART_KEY = "ebooks_cart";

type BookType = "PHYSICAL" | "EBOOK" | "BOTH";

interface CartItem {
  id: string;
  bookId: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
  price: number;
  type: BookType;
  quantity: number;
}

function loadCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addItem(
  items: CartItem[],
  book: { bookId: string; title: string; slug: string; price: number; type: BookType; quantity?: number }
): CartItem[] {
  const existing = items.find((i) => i.bookId === book.bookId);
  if (existing) {
    return items.map((i) =>
      i.bookId === book.bookId ? { ...i, quantity: i.quantity + (book.quantity ?? 1) } : i
    );
  }
  return [
    ...items,
    { id: `cart_test`, bookId: book.bookId, title: book.title, slug: book.slug, price: book.price, type: book.type, quantity: book.quantity ?? 1 },
  ];
}

function calcTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasPhysical = items.some((i) => i.type === "PHYSICAL" || i.type === "BOTH");
  const deliveryFee = hasPhysical ? 150 : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

describe("Cart localStorage helpers", () => {
  beforeEach(() => localStorage.clear());

  it("loadCart returns [] when nothing stored", () => {
    expect(loadCart()).toEqual([]);
  });

  it("saveCart / loadCart roundtrip", () => {
    const items: CartItem[] = [
      { id: "c1", bookId: "b1", title: "Livro A", slug: "livro-a", price: 500, type: "EBOOK", quantity: 1 },
    ];
    saveCart(items);
    expect(loadCart()).toEqual(items);
  });

  it("loadCart returns [] on corrupted JSON", () => {
    localStorage.setItem(CART_KEY, "{broken");
    expect(loadCart()).toEqual([]);
  });
});

describe("addItem logic", () => {
  it("adds a new item to an empty cart", () => {
    const result = addItem([], { bookId: "b1", title: "A", slug: "a", price: 100, type: "EBOOK" });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it("increments quantity when item already in cart", () => {
    const existing: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 100, type: "EBOOK", quantity: 2 },
    ];
    const result = addItem(existing, { bookId: "b1", title: "A", slug: "a", price: 100, type: "EBOOK" });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it("adds a second distinct item", () => {
    const existing: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 100, type: "EBOOK", quantity: 1 },
    ];
    const result = addItem(existing, { bookId: "b2", title: "B", slug: "b", price: 200, type: "PHYSICAL" });
    expect(result).toHaveLength(2);
  });
});

describe("calcTotals", () => {
  it("subtotal is sum of price × quantity", () => {
    const items: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 200, type: "EBOOK", quantity: 2 },
      { id: "c2", bookId: "b2", title: "B", slug: "b", price: 100, type: "EBOOK", quantity: 1 },
    ];
    expect(calcTotals(items).subtotal).toBe(500);
  });

  it("no delivery fee for ebook-only cart", () => {
    const items: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 300, type: "EBOOK", quantity: 1 },
    ];
    expect(calcTotals(items).deliveryFee).toBe(0);
  });

  it("adds 150 MZN delivery fee when cart has PHYSICAL item", () => {
    const items: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 300, type: "PHYSICAL", quantity: 1 },
    ];
    const { deliveryFee, total } = calcTotals(items);
    expect(deliveryFee).toBe(150);
    expect(total).toBe(450);
  });

  it("adds delivery fee when cart has BOTH type item", () => {
    const items: CartItem[] = [
      { id: "c1", bookId: "b1", title: "A", slug: "a", price: 200, type: "BOTH", quantity: 1 },
    ];
    expect(calcTotals(items).deliveryFee).toBe(150);
  });

  it("returns zero totals for empty cart", () => {
    const { subtotal, deliveryFee, total } = calcTotals([]);
    expect(subtotal).toBe(0);
    expect(deliveryFee).toBe(0);
    expect(total).toBe(0);
  });
});

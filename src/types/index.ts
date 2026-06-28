// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: "CUSTOMER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
}

// ─── Author ───────────────────────────────────────────────────────────────────
export interface Author {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  description?: string;
}

// ─── Book ─────────────────────────────────────────────────────────────────────
export type BookType = "PHYSICAL" | "EBOOK" | "BOTH";

export interface BookSummary {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
  price: number;
  type: BookType;
  authorNames: string[];
  averageRating: number;
  totalReviews: number;
  subscriptionOnly: boolean;
  featured: boolean;
}

export interface Book extends BookSummary {
  description: string;
  isbn?: string;
  pageCount?: number;
  publishedAt?: string;
  publisher?: string;
  language: string;
  authors: Author[];
  categories: Category[];
  previewImages: string[];
  stockQuantity?: number; // for physical books
  ebookSizeBytes?: number;
  reviews: Review[];
  relatedBooks: BookSummary[];
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  bookId: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
  price: number;
  type: BookType;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderItem {
  id: string;
  bookId: string;
  title: string;
  coverImageUrl?: string;
  type: BookType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address?: Address;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  deliveryTracking?: DeliveryTrackingStep[];
}

export interface DeliveryTrackingStep {
  status: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentMethod = "MPESA" | "EMOLA" | "VISA" | "MASTERCARD" | "PAYPAL";
export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface Payment {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  phoneNumber?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING";

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: "MONTHLY" | "ANNUAL";
  price: number;
  currency: string;
  features: string[];
  booksPerMonth?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = "ORDER_UPDATE" | "NEW_BOOK" | "SUBSCRIPTION" | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Reading Session ──────────────────────────────────────────────────────────
export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  lastReadAt: string;
  deviceId: string;
}

// ─── Library Item ─────────────────────────────────────────────────────────────
export interface LibraryItem {
  book: BookSummary;
  accessType: "PURCHASED" | "SUBSCRIPTION";
  readingSession?: ReadingSession;
  purchasedAt?: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  errors?: Record<string, string>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ─── Catalog Filters ──────────────────────────────────────────────────────────
export interface CatalogFilters {
  search?: string;
  type?: BookType;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  subscriptionOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

// ─── DRM Reader ───────────────────────────────────────────────────────────────
export interface DrmTokenResponse {
  token: string;
  bookId: string;
  totalPages: number;
  expiresAt: string;
}

export interface DrmPageResponse {
  pageNumber: number;
  totalPages: number;
  pdfBase64: string;
  newToken: string;
}

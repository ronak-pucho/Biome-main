export type DomainType = "ecommerce" | "food" | "rides" | "travel" | "hospitality";

export type Money = {
  currency: "INR";
  amount: number;
};

export type OfferApplied = {
  type: "coupon" | "bank" | "wallet" | "platform" | "other";
  label: string;
  value?: Money;
  code?: string;
};

export type NormalizedItem = {
  id: string;
  name: string;
  provider: string;
  domain: DomainType;
  itemUrl: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  listPrice?: Money;
  finalPrice: Money;
  deliveryEtaMinutes?: number;
  offersApplied?: OfferApplied[];
  raw?: unknown;
};

export type SearchIntent = {
  domain: DomainType;
  category?: string;
  budget?: Money;
  features?: string[];
  keywords?: string[];
};

export type AIRecommendation = {
  bestOverall?: NormalizedItem;
  bestValue?: NormalizedItem;
  recommendations: Array<{
    item: NormalizedItem;
    reason: string;
    confidence: number;
  }>;
  comparisonInsights?: string[];
  reviewSummary?: string;
  pricePrediction?: {
    recommendation: string;
    confidence: number;
  };
};

export type SearchResult = {
  searchId: string;
  query: string;
  intent: SearchIntent;
  items: NormalizedItem[];
  ai: AIRecommendation;
  generatedAt: string;
  cache: { hit: boolean; key: string };
};

export type UserEntity = {
  id: string;
  googleId?: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  provider: "google" | "email" | "phone" | "signup";
  preferences?: Record<string, unknown>;
  lastLogin?: string;
  createdAt: string;
  // Sign-up extended fields
  mobile_number?: string;
  password_hash?: string;
  dob?: string;
  location?: string;
  device_id?: string;
  version_code?: string | number;
  version_name?: string;
  profile_pic?: string;
  device_type?: "android" | "ios" | "web" | "other";
};

export type SearchHistoryEntity = {
  id: string;
  userId?: string;
  query: string;
  domain: DomainType;
  intent: SearchIntent;
  resultsCount: number;
  topResult?: NormalizedItem;
  alternatives?: NormalizedItem[];
  createdAt: string;
};

export type ClickEventEntity = {
  id: string;
  userId?: string;
  searchId?: string;
  itemName?: string;
  itemUrl: string;
  provider: string;
  price?: number;
  createdAt: string;
};

export type OrderStatus = "CREATED" | "PAYMENT_PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

export type OrderEntity = {
  id: string;
  userId: string;
  domain: DomainType;
  provider: string;
  title: string;
  itemUrl: string;
  amount: Money;
  status: OrderStatus;
  paymentIntentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

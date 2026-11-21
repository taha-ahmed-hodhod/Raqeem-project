export type BookPageCount = 12 | 24;

export type OrderLifecycleStage =
  | "new"
  | "contacted"
  | "confirmed"
  | "designing"
  | "printing"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "cancelled";

export interface BookVariantRow {
  page_count: BookPageCount;
  price_piastres: number;
  price_egp: number;
  active: boolean;
  title_ar: string;
  title_en: string;
  updated_at: string;
}

export interface PromotionRow {
  min_quantity: number;
  percent: number;
  active: boolean;
  title_ar: string;
  title_en: string;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

export interface GovernorateRow {
  code: string;
  name_ar: string;
  name_en: string;
  fee_piastres: number | null;
  active: boolean;
  sort_order: number;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  phone: string;
  whatsapp_phone: string | null;
  address: string;
  governorate: string;
  notes: string | null;
  count_12: number;
  count_24: number;
  total_count_12?: number;
  total_count_24?: number;
  price_12: number;
  price_24: number;
  discount_percent: number;
  shipping_piastres: number | null;
  subtotal_piastres: number;
  discount_piastres: number;
  books_subtotal_piastres?: number;
  books_discount_piastres?: number;
  books_total_piastres?: number;
  deposit_selected_piastres?: number | null;
  deposit_status?: "not_specified" | "pending" | "received";
  deposit_received_at?: string | null;
  final_quote_piastres: number | null;
  photo_path: string | null;
  status: string;
  lifecycle_stage: OrderLifecycleStage;
  consent_accepted: boolean;
  consent_at: string;
  admin_notes: string | null;
  idempotency_key: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  item_index: number;
  page_count: BookPageCount;
  quantity: number;
  child_name: string;
  child_age: number;
  age_label?: string | null;
  interests: string | null;
  notes: string | null;
  photo_path: string;
  unit_price_piastres: number;
  created_at: string;
}

export interface OrderStatusEventRow {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

export interface PortfolioEntryRow {
  id: string;
  slug: string | null;
  title: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string;
  cartoon_image_url: string | null;
  coloring_page_url: string | null;
  book_mockup_url: string | null;
  kind: "sample" | "authorized";
  is_demo: boolean;
  guardian_consent_verified: boolean;
  published: boolean;
  display_order: number;
  created_at: string;
  short_summary_ar?: string | null;
  short_summary_en?: string | null;
  story_interests_ar?: string | null;
  story_interests_en?: string | null;
  story_idea_ar?: string | null;
  story_idea_en?: string | null;
  story_hero_ar?: string | null;
  story_hero_en?: string | null;
}

export interface CustomerReviewRow {
  id: string;
  reviewer_name: string;
  reviewer_age: string;
  rating: number;
  comment: string;
  avatar_index: 0 | 1 | 2;
  status: "pending" | "approved" | "rejected" | "hidden";
  created_at: string;
  approved_at: string | null;
}

export interface SocialLinkRow {
  id: string;
  platform: string;
  label_ar: string;
  label_en: string;
  icon_key: "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube" | "globe";
  url: string | null;
  active: boolean;
  sort_order: number;
  updated_at: string;
}

export interface PosterPopupSettings {
  enabled: boolean;
  imageUrl: string | null;
  buttonTextAr: string;
  buttonTextEn: string;
  buttonUrl: string;
}

export interface AdminNotificationRow {
  id: string;
  order_id: string | null;
  type: "new_order" | "status_change" | "system";
  title_ar: string;
  title_en: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationOutboxRow {
  id: string;
  event_key: string;
  order_id: string | null;
  channel: "web_push" | "email";
  status: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  last_error: string | null;
  next_retry_at: string;
  sent_at: string | null;
  created_at: string;
}

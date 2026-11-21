import { z } from "zod";

export const EGYPT_GOVERNORATE_CODES = [
  "cairo",
  "giza",
  "alexandria",
  "qalyubia",
  "dakahlia",
  "sharqia",
  "gharbia",
  "monufia",
  "beheira",
  "kafr-el-sheikh",
  "damietta",
  "port-said",
  "ismailia",
  "suez",
  "fayoum",
  "beni-suef",
  "minya",
  "assiut",
  "sohag",
  "qena",
  "luxor",
  "aswan",
  "red-sea",
  "new-valley",
  "matrouh",
  "north-sinai",
  "south-sinai",
] as const;

export type EgyptGovernorateCode = (typeof EGYPT_GOVERNORATE_CODES)[number];

/**
 * Matches standard Egyptian mobile numbers:
 * 010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, 015xxxxxxxx
 * (optionally prefixed with +20 or 0020, spaces/dashes stripped before validation).
 */
export function normalizeEgyptianPhone(raw: string): string {
  const digitsAndPlus = raw.replace(/[\s\-()]/g, "");
  if (digitsAndPlus.startsWith("+20")) {
    return "0" + digitsAndPlus.slice(3);
  }
  if (digitsAndPlus.startsWith("0020")) {
    return "0" + digitsAndPlus.slice(4);
  }
  return digitsAndPlus;
}

export const egyptianPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeEgyptianPhone)
  .refine((val) => /^01[0125][0-9]{8}$/.test(val), {
    message: "invalid_egyptian_mobile",
  });

export const ALLOWED_DEPOSIT_EGP_VALUES = [100, 200, 300] as const;
export type AllowedDepositEgp = (typeof ALLOWED_DEPOSIT_EGP_VALUES)[number];

export const orderBookItemInputSchema = z.object({
  pageCount: z.union([z.literal(12), z.literal(24)]),
  quantity: z.number().int().min(1).max(20).default(1),
  childName: z.string().trim().min(1).max(100),
  childAge: z.number().int().min(1).max(99),
  ageLabel: z.string().trim().max(60).optional(),
  interests: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  photoPath: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
      (p) => !p.includes("..") && /^orders\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(p),
      { message: "invalid_private_photo_path" },
    ),
});

export const orderRequestInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(orderBookItemInputSchema).min(1).max(20),
  customerName: z.string().trim().min(2).max(120),
  phone: egyptianPhoneSchema,
  whatsappPhone: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined))
    .pipe(egyptianPhoneSchema.optional()),
  governorate: z.enum(EGYPT_GOVERNORATE_CODES),
  address: z.string().trim().min(5).max(500),
  notes: z.string().trim().max(1000).optional(),
  depositSelectedEgp: z
    .union([z.literal(100), z.literal(200), z.literal(300)])
    .optional(),
  consentAccepted: z.literal(true, {
    error: "guardian_consent_required",
  }),
  honeypot: z
    .string()
    .optional()
    .refine((val) => !val || val.trim().length === 0, {
      message: "spam_detected",
    }),
});

export type OrderBookItemInput = z.infer<typeof orderBookItemInputSchema>;
export type OrderRequestInput = z.infer<typeof orderRequestInputSchema>;

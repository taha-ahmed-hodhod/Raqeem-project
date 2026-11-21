export const RAQEEM_REVIEW_AVATARS = [
  {
    id: 0 as const,
    src: "/images/review-avatar-astronaut.png",
    altAr: "رائد الفضاء من عائلة رقيم",
    altEn: "Raqeem astronaut character",
  },
  {
    id: 1 as const,
    src: "/images/review-avatar-girl-bow.png",
    altAr: "الطفلة بالفيونكة من عائلة رقيم",
    altEn: "Raqeem girl with bow character",
  },
  {
    id: 2 as const,
    src: "/images/review-avatar-boy-glasses.png",
    altAr: "الطفل بالنظارة من عائلة رقيم",
    altEn: "Raqeem boy with glasses character",
  },
] as const;

export type RaqeemReviewAvatar = (typeof RAQEEM_REVIEW_AVATARS)[number];

/**
 * Resolves the persistent avatar bound to a specific review's stored `avatar_index`.
 * Never computed from visual slot or carousel position.
 */
export function getReviewAvatar(
  avatarIndex: number | null | undefined,
): RaqeemReviewAvatar {
  const safeIndex =
    typeof avatarIndex === "number" && Number.isInteger(avatarIndex)
      ? ((avatarIndex % 3) + 3) % 3
      : 0;
  return RAQEEM_REVIEW_AVATARS[safeIndex] ?? RAQEEM_REVIEW_AVATARS[0];
}

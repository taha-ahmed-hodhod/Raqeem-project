import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CustomerReviewRow } from "@/lib/supabase/types";
import { ReviewModerationCard } from "@/features/reviews/review-moderation-card";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("customer_reviews")
    .select("*")
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as CustomerReviewRow[];
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-foreground">
          آراء العملاء والمراجعة ({pendingCount} بانتظار المراجعة)
        </h1>
        <p className="text-sm text-muted-foreground">
          راجع آراء الزوار الجديدة، عدّل النص إن لزم، واقبلها للنشر أو أخفها أو
          ارفضها. لا يظهر أي رأي للزوار قبل موافقتك هنا.
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          لا توجد آراء مسجلة حتى الآن.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <ReviewModerationCard
              key={`${review.id}-${review.status}`}
              review={review}
            />
          ))}
        </div>
      )}
    </div>
  );
}

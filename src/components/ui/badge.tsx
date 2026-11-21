import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary-50 text-primary-600 border-primary-500/20",
        yellow: "bg-accent-yellow-50 text-foreground border-accent-yellow/40",
        pink: "bg-secondary-pink-50 text-foreground border-secondary-pink/30",
        neutral: "bg-surface-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

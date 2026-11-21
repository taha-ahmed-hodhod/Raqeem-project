import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm",
        secondary:
          "bg-surface text-primary-500 border border-border hover:bg-primary-50 active:bg-primary-50",
        accent:
          "bg-accent-yellow text-foreground hover:brightness-95 active:brightness-90 shadow-sm",
        ghost:
          "bg-transparent text-foreground hover:bg-primary-50 hover:text-primary-600",
        link: "bg-transparent text-primary-500 underline-offset-4 hover:underline min-h-0 px-0",
      },
      size: {
        default: "px-5 py-2.5 text-base",
        sm: "px-4 py-2 text-sm",
        lg: "px-7 py-3.5 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

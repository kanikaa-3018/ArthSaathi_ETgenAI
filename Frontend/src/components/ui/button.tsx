import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Use `_/_` before alpha so Tailwind does not treat `/` as its own opacity syntax. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-syne font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent)_/_0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg-primary))] disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-md border border-[hsl(var(--btn-primary-border)_/_0.45)] bg-[hsl(var(--btn-primary-bg))] text-[hsl(var(--btn-primary-text))] shadow-[inset_0_1px_0_0_hsl(0_0%_100%_/_0.12)] hover:bg-[hsl(var(--btn-primary-bg-hover))] hover:border-[hsl(var(--btn-primary-border)_/_0.65)] hover:shadow-[0_8px_28px_-12px_hsl(var(--accent)_/_0.55)]",
        destructive:
          "rounded-md border border-[hsl(0_65%_40%_/_0.35)] bg-[hsl(var(--negative))] text-[hsl(var(--destructive-foreground))] shadow-[inset_0_1px_0_0_hsl(0_0%_100%_/_0.14)] hover:brightness-[0.94] hover:shadow-[0_8px_28px_-12px_hsl(var(--negative)_/_0.45)]",
        outline:
          "rounded-md border border-[hsl(220_12%_26%)] bg-[hsl(var(--bg-secondary)_/_0.5)] text-text-primary hover:border-[hsl(var(--accent)_/_0.28)] hover:bg-[hsl(var(--bg-tertiary)_/_0.85)] hover:text-text-primary",
        secondary:
          "rounded-md border border-[hsl(220_10%_22%)] bg-[hsl(var(--bg-elevated))] text-text-primary hover:border-[hsl(var(--accent)_/_0.22)] hover:bg-[hsl(220_14%_20%)]",
        ghost:
          "rounded-md text-text-secondary hover:bg-[hsl(var(--accent)_/_0.1)] hover:text-[hsl(var(--accent-hover))]",
        link:
          "rounded-md font-medium text-[hsl(var(--accent))] underline-offset-[3px] hover:text-[hsl(var(--accent-hover))] hover:underline active:scale-100",
        /** Large marketing / hero CTA */
        cta:
          "rounded-lg border border-[hsl(var(--btn-primary-border)_/_0.55)] bg-[hsl(var(--btn-primary-bg))] text-[hsl(var(--btn-primary-text))] text-[14px] shadow-[inset_0_1px_0_0_hsl(0_0%_100%_/_0.15),0_4px_20px_-8px_hsl(var(--accent)_/_0.42)] hover:bg-[hsl(var(--btn-primary-bg-hover))] hover:border-[hsl(var(--btn-primary-border)_/_0.75)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_hsl(0_0%_100%_/_0.15),0_14px_40px_-12px_hsl(var(--accent)_/_0.5)]",
        ctaOutline:
          "rounded-lg border border-[hsl(220_12%_28%)] bg-[hsl(var(--accent)_/_0.06)] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--accent)_/_0.38)] hover:bg-[hsl(var(--accent)_/_0.12)] hover:text-[hsl(var(--accent-hover))]",
        /** Compact header actions */
        navPrimary:
          "rounded-lg border border-[hsl(var(--btn-primary-border)_/_0.48)] bg-[hsl(var(--btn-primary-bg))] text-[hsl(var(--btn-primary-text))] text-[13px] shadow-[inset_0_1px_0_0_hsl(0_0%_100%_/_0.11)] hover:bg-[hsl(var(--btn-primary-bg-hover))] hover:shadow-[0_8px_26px_-12px_hsl(var(--accent)_/_0.48)] hover:-translate-y-px",
        navOutline:
          "rounded-lg border border-[hsl(220_12%_26%)] bg-[hsl(var(--bg-primary)_/_0.35)] text-[hsl(var(--text-secondary))] text-[13px] hover:border-[hsl(var(--accent)_/_0.32)] hover:bg-[hsl(var(--accent)_/_0.08)] hover:text-[hsl(var(--accent-hover))]",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-xs rounded-md",
        lg: "h-11 px-8 text-base rounded-md",
        icon: "h-10 w-10 rounded-md p-0 active:scale-95",
        cta: "h-12 px-7",
        nav: "h-9 px-4",
        /** Text-style control; use with variant `link` */
        inline: "h-auto min-h-0 px-0 py-0 text-[14px] md:text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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

export { Button, buttonVariants };

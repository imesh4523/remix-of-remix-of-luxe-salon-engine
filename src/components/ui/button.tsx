import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground",
          "shadow-[0_4px_14px_0_hsl(var(--primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:shadow-[0_6px_20px_0_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.4)]",
          "hover:-translate-y-0.5 hover:brightness-110",
          "active:translate-y-0 active:shadow-[0_2px_8px_0_hsl(var(--primary)/0.25)]",
        ].join(" "),
        destructive: [
          "bg-gradient-to-br from-destructive to-destructive/85 text-destructive-foreground",
          "shadow-[0_4px_14px_0_hsl(var(--destructive)/0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_6px_20px_0_hsl(var(--destructive)/0.4)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ].join(" "),
        outline: [
          "border border-border bg-white/60 backdrop-blur-sm",
          "shadow-[0_2px_8px_rgba(100,120,150,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]",
          "hover:bg-white/80 hover:border-primary/40 hover:text-primary",
          "hover:shadow-[0_4px_16px_rgba(100,120,150,0.15),0_0_20px_hsl(var(--primary)/0.1)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ].join(" "),
        secondary: [
          "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground",
          "shadow-[0_4px_14px_0_rgba(100,120,150,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "hover:shadow-[0_6px_20px_0_rgba(100,120,150,0.2)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ].join(" "),
        ghost: [
          "hover:bg-white/60 hover:text-foreground",
          "hover:shadow-[0_2px_12px_rgba(100,120,150,0.1)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0 active:bg-white/70",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline hover:brightness-110",
        glass: [
          "bg-white/50 backdrop-blur-md border border-white/60",
          "shadow-[0_4px_16px_rgba(100,120,150,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]",
          "hover:bg-white/70 hover:border-white/80",
          "hover:shadow-[0_8px_32px_rgba(100,120,150,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]",
          "hover:-translate-y-1",
          "active:translate-y-0",
        ].join(" "),
        premium: [
          "bg-gradient-to-br from-accent via-primary to-accent text-accent-foreground",
          "shadow-[0_4px_20px_0_hsl(var(--accent)/0.35),inset_0_1px_0_rgba(255,255,255,0.35)]",
          "hover:shadow-[0_8px_30px_0_hsl(var(--accent)/0.45),0_0_40px_hsl(var(--primary)/0.2)]",
          "hover:-translate-y-1 hover:scale-[1.02]",
          "active:translate-y-0 active:scale-100",
          "animate-shimmer bg-[length:200%_100%]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

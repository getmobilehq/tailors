import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-[--success-light] text-[--success-dark] [a&]:hover:opacity-90",
        warning:
          "border-transparent bg-[--warning-light] text-[--warning-dark] [a&]:hover:opacity-90",
        info:
          "border-transparent bg-[--info-light] text-[--info-dark] [a&]:hover:opacity-90",

        // Actor-based variants
        customer:
          "border-transparent bg-[--actor-customer-light] text-[--actor-customer-dark] [a&]:hover:opacity-90",
        runner:
          "border-transparent bg-[--actor-runner-light] text-[--actor-runner-dark] [a&]:hover:opacity-90",
        tailor:
          "border-transparent bg-[--actor-tailor-light] text-[--actor-tailor-dark] [a&]:hover:opacity-90",
        ops:
          "border-transparent bg-[--actor-ops-light] text-[--actor-ops-dark] [a&]:hover:opacity-90",

        // Phase-based variants
        booking:
          "border-transparent bg-[--phase-booking-light] text-[--phase-booking] [a&]:hover:opacity-90",
        pickup:
          "border-transparent bg-[--phase-pickup-light] text-[--phase-pickup-dark] [a&]:hover:opacity-90",
        processing:
          "border-transparent bg-[--phase-processing-light] text-[--phase-processing-dark] [a&]:hover:opacity-90",
        qc:
          "border-transparent bg-[--phase-qc-light] text-[--phase-qc-dark] [a&]:hover:opacity-90",
        delivery:
          "border-transparent bg-[--phase-delivery-light] text-[--phase-delivery-dark] [a&]:hover:opacity-90",
        complete:
          "border-transparent bg-[--phase-complete-light] text-[--phase-complete-dark] [a&]:hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

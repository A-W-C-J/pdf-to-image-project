import * as React from "react"
import { Button, buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  asChild?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading
    
    return (
      <Button
        className={cn(
          "relative transition-all duration-200",
          loading && "cursor-not-allowed",
          className
        )}
        variant={variant}
        size={size}
        asChild={asChild}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
export type { LoadingButtonProps }
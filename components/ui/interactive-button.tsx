import * as React from "react"
import { Button, buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

interface InteractiveButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  asChild?: boolean
  enableClickFeedback?: boolean
  enableHoverScale?: boolean
}

const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    enableClickFeedback = true,
    enableHoverScale = true,
    onClick,
    ...props 
  }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false)
    const isDisabled = disabled || loading
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return
      
      if (enableClickFeedback) {
        setIsClicked(true)
        setTimeout(() => setIsClicked(false), 150)
      }
      
      onClick?.(e)
    }, [isDisabled, enableClickFeedback, onClick])
    
    return (
      <Button
        className={cn(
          "relative transition-all duration-200",
          enableHoverScale && !isDisabled && "hover:scale-105 active:scale-95",
          isClicked && "scale-95",
          loading && "cursor-not-allowed",
          !isDisabled && "hover:shadow-md",
          className
        )}
        variant={variant}
        size={size}
        asChild={asChild}
        disabled={isDisabled}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        <span className={cn(
          "flex items-center gap-2 transition-all duration-200",
          loading && "opacity-90"
        )}>
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {loading ? (loadingText || children) : children}
        </span>
      </Button>
    )
  }
)

InteractiveButton.displayName = "InteractiveButton"

export { InteractiveButton }
export type { InteractiveButtonProps }
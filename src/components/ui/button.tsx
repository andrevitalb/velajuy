import { Loader2 } from "lucide-react"
import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const base =
	"inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out " +
	"active:scale-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

const variants: Record<Variant, string> = {
	primary: "bg-velajuy-wine text-velajuy-cream hover:bg-velajuy-wine-soft",
	secondary:
		"border border-velajuy-wine text-velajuy-wine bg-transparent hover:bg-velajuy-pink-soft",
	ghost: "text-velajuy-wine hover:bg-velajuy-pink-soft",
	danger: "bg-danger text-white hover:bg-danger/90",
}

const sizes: Record<Size, string> = {
	sm: "h-9 px-3 text-sm rounded-md",
	md: "h-11 px-4 text-sm rounded-lg",
	lg: "h-12 px-5 text-base rounded-xl",
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant
	size?: Size
	pending?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
	{ className, variant = "primary", size = "md", pending, disabled, children, ...rest },
	ref,
) {
	return (
		<button
			ref={ref}
			disabled={disabled || pending}
			aria-busy={pending || undefined}
			className={cn(base, variants[variant], sizes[size], className)}
			{...rest}
		>
			{pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
			{children}
		</button>
	)
})

// Export individual pieces for advanced usage
import { cva } from "class-variance-authority"



export const inputStyle = cva(
	`
		flex h-9 w-full min-w-0 rounded-lg border border-input px-3 py-1 text-base
		shadow-xs outline-none

		placeholder:text-muted-foreground

		selection:bg-primary selection:text-primary-foreground

		bg-[var(--input-bg)]

		focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]

		aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
		aria-invalid:border-destructive

		transition-[color,box-shadow]

		file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent
		file:text-sm file:font-medium

		disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50

		md:text-sm
	`,
	{
		variants: {
			glimmer: {
				true: "border-[#705E00] dark:border-[#705E00] bg-[#FFE601]/26 dark:bg-[#FFE601]/26",
				false: ""
			}
		},
		defaultVariants: {
			glimmer: false
		}
	}
)

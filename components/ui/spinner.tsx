
import { cn } from "@/lib/utils"
import { RiLoader2Line } from "react-icons/ri"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <RiLoader2Line
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }

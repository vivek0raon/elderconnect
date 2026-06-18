import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

const Avatar = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Avatar.displayName = "Avatar";

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-sm",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback };
export { User };

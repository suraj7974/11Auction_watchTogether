import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar showing the user's initials on their profile color. */
export function UserAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback
        style={{ backgroundColor: color }}
        className="text-xs font-semibold text-white"
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

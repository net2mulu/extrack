"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

function getInitials(nameOrEmail?: string | null) {
  const v = (nameOrEmail || "").trim();
  if (!v) return "U";
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return v.slice(0, 2).toUpperCase();
}

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthRoute = pathname?.startsWith("/auth") ?? false;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Hide on auth pages (must be AFTER hooks to keep hook order stable)
  if (isAuthRoute) return null;

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-md px-3 sm:p-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="ExTrack"
            className="h-10 w-auto sm:h-11 object-contain"
          />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-center"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Open account menu"
          >
            <span className="text-xs font-bold">{initials}</span>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border shadow-xl opacity-100"
              style={{ backgroundColor: "hsl(var(--background))" }}
            >
              <div className="px-3 py-2 border-b">
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="text-sm font-semibold truncate">{displayName}</div>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  // placeholder for future profile page
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                  onClick={async () => {
                    setOpen(false);
                    await signOut({ callbackUrl: "/auth/signin" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



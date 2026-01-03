"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
}


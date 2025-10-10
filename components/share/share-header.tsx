"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface ShareHeaderProps {
  threadName: string;
  onLogin: () => void;
  artifactOpen?: boolean;
}

export function ShareHeader({ threadName, onLogin, artifactOpen }: ShareHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Reoutfit"
          width={36}
          height={36}
        />
          <div className="hidden md:block">
            <h1 className="text-sm font-medium text-foreground">{threadName}</h1>
            <p className="text-xs text-muted-foreground">Shared thread (read-only)</p>
          </div>
      </div>

      {/* Right: Login button - hidden when artifact is open */}
      {!artifactOpen && (
        <Button variant="outline" onClick={onLogin} className="gap-2">
          <LogIn className="h-4 w-4" />
          <span>Login to interact</span>
        </Button>
      )}
    </header>
  );
}

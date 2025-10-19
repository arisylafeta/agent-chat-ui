"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";
import { useStudio } from "@/providers/studio-provider";
import { useStudioArtifactTrigger } from "@/providers/studio-artifact-provider";

export function StudioToggle() {
  const { selectedCount } = useStudio();
  const { openStudio } = useStudioArtifactTrigger();

  const handleClick = () => {
    openStudio();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative"
      onClick={handleClick}
    >
      <LayoutDashboard className="size-4 mr-2" />
      Studio
      {selectedCount > 0 && (
        <Badge
          variant="secondary"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent-2 text-white border-none"
        >
          {selectedCount}
        </Badge>
      )}
    </Button>
  );
}

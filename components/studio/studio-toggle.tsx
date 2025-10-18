import { Button } from "../ui/button";
import { LayoutDashboard } from "lucide-react";

export function StudioToggle() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="relative"
      onClick={() => {
        // TODO: Navigate to studio/wardrobe
        console.log('Studio clicked');
      }}
    >
      <LayoutDashboard className="size-4 mr-2" />
      Studio
      {/* Badge for selected items count - will be implemented later */}
      {/* <Badge
        variant="secondary"
        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        0
      </Badge> */}
    </Button>
  );
}

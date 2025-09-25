import { Button } from "../ui/button";
import { PanelRightOpen, PanelRightClose, Plus } from "lucide-react";
import Image from "next/image";

export function ChatHeader(props: {
  chatStarted: boolean;
  isOverlayLayout: boolean;
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  onToggleSidebar: () => void;
  onNewThread: () => void;
}) {
  const {
    chatStarted: _chatStarted,
    isOverlayLayout,
    isLargeScreen: _isLargeScreen,
    chatHistoryOpen,
    onToggleSidebar,
    onNewThread,
  } = props;

  if (isOverlayLayout) return null;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {/* Left: Buttons (sidebar toggle first with border, then New Chat) */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          {chatHistoryOpen ? (
            <PanelRightOpen className="size-5" />
          ) : (
            <PanelRightClose className="size-5" />
          )}
        </Button>

        <Button
          size="icon"
          onClick={onNewThread}
          variant="outline"
          aria-label="New Chat"
        >
          <Plus className="size-5" />

        </Button>
      </div>

      {/* Right: Wordmark */}
      <div className="ml-auto">
          <Image
          src="/logo.png"
          alt="Reoutfit"
          width={40}
          height={40}
          />
      </div>
    </header>
  );
}

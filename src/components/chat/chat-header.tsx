import { TooltipIconButton } from "../ui/tooltip-icon-button";
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
        <TooltipIconButton
          tooltip="Toggle sidebar"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          variant="outline"
        >
          {chatHistoryOpen ? (
            <PanelRightOpen className="size-5" />
          ) : (
            <PanelRightClose className="size-5" />
          )}
        </TooltipIconButton>

        <TooltipIconButton
          tooltip="New Chat"
          aria-label="New Chat"
          onClick={onNewThread}
          variant="outline"
        >
          <Plus className="size-5" />
        </TooltipIconButton>
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

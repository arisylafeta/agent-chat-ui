import { TooltipIconButton } from "../ui/tooltip-icon-button";
import { PanelRightOpen, PanelRightClose, Plus, Puzzle } from "lucide-react";
import Image from "next/image";
import { PrivacyToggle } from "./privacy-toggle";
import { Button } from "../ui/button";

export function ChatHeader(props: {
  chatStarted: boolean;
  isOverlayLayout: boolean;
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  onToggleSidebar: () => void;
  onNewThread: () => void;
  threadId?: string;
  isPublic?: boolean;
  onPrivacyChange?: () => void;
  opened?: boolean;
}) {
  const {
    chatStarted: _chatStarted,
    isOverlayLayout,
    isLargeScreen: _isLargeScreen,
    chatHistoryOpen,
    onToggleSidebar,
    onNewThread,
    threadId,
    isPublic,
    onPrivacyChange,
  } = props;
  const opened = props.opened ?? false;

  if (isOverlayLayout) return null;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {/* Left: Buttons (sidebar toggle first with border, then New Chat) */}
      <div className="flex items-center gap-2">
        {!opened && (
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
        )}

          <TooltipIconButton
            tooltip="New Chat"
            aria-label="New Chat"
            onClick={onNewThread}
            variant="outline"
          >
            <Plus className="size-5" />
          </TooltipIconButton>


        {/* Privacy Toggle - only show if thread exists */}
        {threadId && (
          <PrivacyToggle
            threadId={threadId}
            isPublic={isPublic ?? false}
            onUpdate={onPrivacyChange}
          />
        )}
      </div>

      {/* Right: Studio Button and Wordmark */}
      <div className="ml-auto flex items-center gap-2">
        {/* Studio Button - always visible */}
        <Button
          variant="outline"
          size="sm"
          className="relative"
          onClick={() => {
            // TODO: Navigate to studio/wardrobe
            console.log('Studio clicked');
          }}
        >
          <Puzzle className="size-4 mr-2" />
          Studio
          {/* Badge for selected items count - will be implemented later */}
          {/* <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            0
          </Badge> */}
        </Button>

        {/* Logo */}
        {!opened && (
          <Image
            src="/logo.png"
            alt="Reoutfit"
            width={36}
            height={36}
          />
        )}
      </div>
    </header>
  );
}

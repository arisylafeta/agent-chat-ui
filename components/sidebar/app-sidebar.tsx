import { useQueryState, parseAsBoolean } from "nuqs";
import { Sheet, SheetContent } from "../ui/sheet";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import ChatHistory from "./chat-history";
import { NavUser } from "./nav-user";
import Image from "next/image";
import Link from "next/link";
import { PanelRightOpen, PanelRightClose, Search, ShoppingBag, BookOpen, Archive, Sparkles } from "lucide-react";
import { TooltipIconButton } from "../ui/tooltip-icon-button";

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  return (
    <>
      <div className="shadow-inner-right hidden h-screen w-full shrink-0 bg-secondary md:flex">
        <div className="flex h-full w-full flex-col">
          {/* Top section: header with toggle + logo, followed by quick links */}
          <div className="px-2 py-1.5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              {/* Logo left, 36px to match chat header */}
              <Image src="/logo.png" alt="Reoutfit" width={36} height={36} />
              {/* Toggle right, identical to chat-header TooltipIconButton */}
              <TooltipIconButton
                tooltip="Toggle sidebar"
                aria-label="Toggle sidebar"
                onClick={() => setChatHistoryOpen((p) => !p)}
                variant="outline"
              >
                {chatHistoryOpen ? (
                  <PanelRightOpen className="size-5" />
                ) : (
                  <PanelRightClose className="size-5" />
                )}
              </TooltipIconButton>
            </div>

            {/* Quick links */}
            <nav className="mt-3 px-2 mb-6">
              <ul className="flex flex-col gap-1">
                <li>
                  <Link href="/search" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <Search className="size-4 text-muted-foreground" />
                    <span>Search chats</span>
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <ShoppingBag className="size-4 text-muted-foreground" />
                    <span>Browse products</span>
                  </Link>
                </li>
                <li>
                  <Link href="/lookbook" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <span>Lookbook</span>
                  </Link>
                </li>
                <li>
                  <Link href="/wardrobe" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <Archive className="size-4 text-muted-foreground" />
                    <span>Wardrobe</span>
                  </Link>
                </li>
                <li>
                  <Link href="/inspiration" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <span>Inspiration</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Middle section: title + scrollable chat history */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3">
            <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">
              Chats
            </h2>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatHistory />
            </div>
          </div>

          {/* Bottom section: user nav */}
          <div className="border-t px-2 py-2">
            <NavUser />
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent side="left" className="md:hidden p-0 bg-secondary w-[256px]">
            <div className="flex h-full w-full flex-col">
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  {/* Logo left */}
                  <Image src="/logo.png" alt="Reoutfit" width={36} height={36} />
                  {/* Toggle right, identical to chat-header TooltipIconButton */}
                  <TooltipIconButton
                    tooltip="Toggle sidebar"
                    aria-label="Toggle sidebar"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                    variant="outline"
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </TooltipIconButton>
                </div>

                {/* Quick links */}
                <nav className="mt-3 px-2 mb-6">
                  <ul className="flex flex-col gap-1">
                    <li>
                      <Link href="/search" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <Search className="size-4 text-muted-foreground" />
                        <span>Search chats</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <ShoppingBag className="size-4 text-muted-foreground" />
                        <span>Browse products</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/lookbook" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <span>Lookbook</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/wardrobe" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <Archive className="size-4 text-muted-foreground" />
                        <span>Wardrobe</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/inspiration" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <Sparkles className="size-4 text-muted-foreground" />
                        <span>Inspiration</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3">
                <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">Chats</h2>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ChatHistory onThreadClick={() => setChatHistoryOpen((o) => !o)} />
                </div>
              </div>

              <div className="border-t px-2 py-2">
                <NavUser />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

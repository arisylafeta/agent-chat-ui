"use client";

import { Sheet, SheetContent } from "../ui/sheet";
import { motion } from "framer-motion";
import SidebarChatHistory from "./sidebar-chat-history";
import { NavUser } from "./nav-user";
import Image from "next/image";
import Link from "next/link";
import { PanelRightOpen, PanelRightClose, Search, ShoppingBag, BookOpen, Archive, Sparkles } from "lucide-react";
import { TooltipIconButton } from "../ui/tooltip-icon-button";
import { SearchCommandDialog } from "../search-command-dialog";
import { Badge } from "../ui/badge";
import { useState } from "react";

interface ChatSidebarProps {
  chatHistoryOpen: boolean;
  toggleSidebar: () => void;
  isLargeScreen: boolean;
  sidebarMotionProps: any;
  SIDEBAR_WIDTH_PX: number;
}

export default function ChatSidebar({ chatHistoryOpen, toggleSidebar, isLargeScreen, sidebarMotionProps, SIDEBAR_WIDTH_PX }: ChatSidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <motion.div {...sidebarMotionProps}>
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
                onClick={toggleSidebar}
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
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Search className="size-4 text-muted-foreground" />
                    <span>Search chats</span>
                  </button>
                </li>
                <li>
                  <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-4 text-muted-foreground" />
                      <span>Browse products</span>
                    </div>
                    <Badge variant="secondary" className="bg-black text-white text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      Coming
                    </Badge>
                  </div>
                </li>
                <li>
                  <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-muted-foreground" />
                      <span>Inspiration</span>
                    </div>
                    <Badge variant="secondary" className="bg-black text-white text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      Coming
                    </Badge>
                  </div>
                </li>
                <li>
                  <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <span>Lookbook</span>
                    </div>
                    <Badge variant="secondary" className="bg-black text-white text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      Coming
                    </Badge>
                  </div>
                </li>
                <li>
                  <Link href="/wardrobe" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <Archive className="size-4 text-muted-foreground" />
                    <span>Wardrobe</span>
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
              <SidebarChatHistory />
            </div>
          </div>

          {/* Bottom section: user nav */}
          <div className="border-t px-2 py-2">
            <NavUser isLargeScreen={isLargeScreen} />
          </div>
        </div>
      </motion.div>
      <div className="md:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            toggleSidebar();
          }}
        >
          <SheetContent side="left" className="md:hidden p-0 bg-secondary" style={{ width: SIDEBAR_WIDTH_PX }}>
            <div className="flex h-full w-full flex-col">
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  {/* Logo left */}
                  <Image src="/logo.png" alt="Reoutfit" width={36} height={36} />
                  {/* Toggle right, identical to chat-header TooltipIconButton */}
                  <TooltipIconButton
                    tooltip="Toggle sidebar"
                    aria-label="Toggle sidebar"
                    onClick={toggleSidebar}
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
                      <button
                        onClick={() => setSearchOpen(true)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Search className="size-4 text-muted-foreground" />
                        <span>Search chats</span>
                      </button>
                    </li>
                    <li>
                      <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="size-4 text-muted-foreground" />
                          <span>Browse products</span>
                        </div>
                        <Badge variant="secondary" className="bg-black text-white-soft text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                          Coming Soon
                        </Badge>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-muted-foreground" />
                          <span>Lookbook</span>
                        </div>
                        <Badge variant="secondary" className="bg-black text-white-soft text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                          Coming Soon
                        </Badge>
                      </div>
                    </li>
                    <li>
                      <Link href="/wardrobe" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        <Archive className="size-4 text-muted-foreground" />
                        <span>Wardrobe</span>
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-muted-foreground" />
                          <span>Inspiration</span>
                        </div>
                        <Badge variant="secondary" className="bg-black-soft text-white-soft text-[10px] px-1.5 py-0 h-4 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                          Coming Soon
                        </Badge>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3">
                <h2 className="mb-2 text-sm font-semibold tracking-tight text-muted-foreground">Chats</h2>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <SidebarChatHistory onThreadClick={toggleSidebar} />
                </div>
              </div>

              <div className="border-t px-2 py-2">
                <NavUser isLargeScreen={isLargeScreen} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <SearchCommandDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Edit2, Trash2, Globe, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ThreadActionsProps {
  threadId: string;
  threadName?: string;
  isPublic: boolean;
  onUpdate: () => void;
}

export function ThreadActions({
  threadId,
  threadName,
  isPublic,
  onUpdate,
}: ThreadActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newName, setNewName] = useState(threadName || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we're currently viewing this thread
  const isCurrentThread = pathname?.includes(threadId);

  const handleRename = async () => {
    if (!newName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error("Failed to rename thread");

      setRenameDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to rename thread:", error);
      alert("Failed to rename thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete thread");

      setDeleteDialogOpen(false);
      
      // If we're deleting the current thread, redirect to home (new chat)
      if (isCurrentThread) {
        router.push('/');
      }
      
      // Refresh the thread list
      onUpdate();
    } catch (error) {
      console.error("Failed to delete thread:", error);
      alert("Failed to delete thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !isPublic }),
      });

      if (!response.ok) throw new Error("Failed to toggle public status");

      onUpdate();
    } catch (error) {
      console.error("Failed to toggle public status:", error);
      alert("Failed to update thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Thread actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setNewName(threadName || "");
              setRenameDialogOpen(true);
            }}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePublic();
            }}
            disabled={isLoading}
          >
            {isPublic ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Make Private
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Make Public
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation thread.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Thread Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter thread name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isLoading || !newName.trim()}>
              {isLoading ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

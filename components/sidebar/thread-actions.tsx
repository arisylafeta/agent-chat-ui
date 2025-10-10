"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
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
import { createClient } from "@/utils/supabase/client";
import { useThreads } from "@/providers/Thread";

interface ThreadActionsProps {
  threadId: string;
  threadName?: string;
  onUpdate: () => void;
}

export function ThreadActions({
  threadId,
  threadName,
  onUpdate,
}: ThreadActionsProps) {
  const router = useRouter();
  const { currentThreadId } = useThreads();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newName, setNewName] = useState(threadName || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    
    setIsLoading(true);
    try {
      // Update directly in Supabase (faster, no backend overhead)
      const supabase = createClient();
      const { error } = await supabase
        .from('thread')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('thread_id', threadId);

      if (error) throw error;

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
      // Check if we're deleting the currently active thread
      const isDeletingCurrentThread = currentThreadId === threadId;

      // Delete directly from Supabase (faster, no backend overhead)
      const supabase = createClient();
      const { error } = await supabase
        .from('thread')
        .delete()
        .eq('thread_id', threadId);

      if (error) throw error;

      setDeleteDialogOpen(false);
      
      // If we deleted the current thread, redirect to home
      if (isDeletingCurrentThread) {
        router.push('/');
      }
      
      // Update thread list
      onUpdate();
    } catch (error) {
      console.error("Failed to delete thread:", error);
      alert("Failed to delete thread. Please try again.");
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
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Thread actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              setNewName(threadName || "");
              setRenameDialogOpen(true);
            }}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
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
        <DialogContent onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
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
        <DialogContent onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
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

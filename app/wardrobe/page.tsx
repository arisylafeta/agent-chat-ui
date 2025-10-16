'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChatHeader } from '@/components/chat/chat-header';
import { useChatSidebar } from '@/hooks/use-chat-sidebar';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { ClothingGrid } from '@/components/wardrobe/clothing-grid';
import { ClothingItemForm } from '@/components/wardrobe/clothing-item-form';
import { WardrobeFilters } from '@/components/wardrobe/wardrobe-filters';
import { useWardrobe } from '@/hooks/use-wardrobe';
import { ClothingItem, ClothingCategory } from '@/types/wardrobe';

export default function WardrobePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  const { chatHistoryOpen, toggleSidebar, isLargeScreen } = useChatSidebar();

  const { items, loading, error, createItem, updateItem, deleteItem, creating, updating } =
    useWardrobe({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
    });

  const handleAddClick = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (item: ClothingItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (item: ClothingItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteItem(item.id);
      toast.success(`"${item.name}" has been removed from your wardrobe.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleFormSubmit = async (data: any, image?: File) => {
    try {
      if (editingItem) {
        console.log('Updating item:', editingItem.id, data);
        await updateItem(editingItem.id, data);
        toast.success(`"${data.name}" has been updated successfully.`);
      } else {
        console.log('Creating item:', data);
        await createItem(data, image);
        toast.success(`"${data.name}" has been added to your wardrobe.`);
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Form submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with sidebar toggle - hides when sidebar is open on large screens */}
      <ChatHeader
        chatStarted={true}
        isOverlayLayout={false}
        isLargeScreen={isLargeScreen}
        chatHistoryOpen={chatHistoryOpen}
        onToggleSidebar={toggleSidebar}
        onNewThread={() => router.push('/')} // Navigate to new chat
        opened={chatHistoryOpen && isLargeScreen}
      />
      
      {/* Title Section with Blob Background */}
      <div className="bg-white pt-12 pb-8">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Blob SVG Background - positioned relative to container */}
          <div className="absolute inset-0  pointer-events-none opacity-20">
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute -top-20 -right-10 w-64 h-64"
            >
              <path
                fill="#BFB4DC"
                d="M46.5,-44.6C57.2,-35.9,60.7,-17.9,57.1,-3.6C53.5,10.8,42.9,21.6,32.3,32.7C21.6,43.8,10.8,55.2,-5.3,60.5C-21.4,65.8,-42.7,64.9,-56.7,53.8C-70.7,42.7,-77.3,21.4,-73.8,3.5C-70.3,-14.4,-56.7,-28.7,-42.7,-37.5C-28.7,-46.3,-14.4,-49.6,1.8,-51.3C17.9,-53.1,35.9,-53.4,46.5,-44.6Z"
                transform="translate(100 100)"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-3">
                Your{' '}
                <span className="bg-gradient-to-r from-accent-1 to-accent-2 bg-clip-text text-transparent">
                  Wardrobe
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Manage your clothing collection
              </p>
            </div>
            <Button onClick={handleAddClick} size="lg" className="shadow-sm">
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <WardrobeFilters
            search={search}
            category={category}
            onSearchChange={setSearch}
            onCategoryChange={(cat) =>
              setCategory(cat as ClothingCategory | 'all')
            }
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia>
                  <Image
                    src="/wardrobe.png"
                    alt="Empty wardrobe"
                    width={200}
                    height={200}
                    className="opacity-80"
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {search || category !== 'all'
                    ? 'No items match your filters'
                    : 'Your wardrobe is empty'}
                </EmptyTitle>
                <EmptyDescription>
                  {search || category !== 'all'
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Start building your digital wardrobe by adding your first clothing item.'}
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleAddClick} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Item
              </Button>
            </Empty>
          )}

          <ClothingGrid
            items={items}
            loading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      {/* Modals */}
      <ClothingItemForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        item={editingItem || undefined}
        loading={creating || updating}
      />
    </div>
  );
}

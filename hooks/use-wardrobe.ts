'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClothingItem, ClothingItemInput, ClothingCategory } from '@/types/wardrobe';
import { createClient } from '@/utils/supabase/client';

interface UseWardrobeOptions {
  category?: ClothingCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useWardrobe(options: UseWardrobeOptions = {}) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.search) params.append('search', options.search);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/wardrobe?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const data = await response.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.category, options.search, options.limit, options.offset, supabase.auth]);

  const createItem = async (input: ClothingItemInput, image?: File) => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('name', input.name);
      formData.append('category', input.category);
      if (input.brand) formData.append('brand', input.brand);
      if (input.colors) formData.append('colors', JSON.stringify(input.colors));
      if (input.seasons) formData.append('seasons', JSON.stringify(input.seasons));
      if (input.price) formData.append('price', input.price.toString());
      if (input.gender) formData.append('gender', input.gender);
      if (input.size) formData.append('size', input.size);
      if (input.notes) formData.append('notes', input.notes);
      if (input.tags) formData.append('tags', JSON.stringify(input.tags));
      if (image) formData.append('image', image);

      const response = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create item');
      }

      const data = await response.json();
      await fetchItems(); // Refresh the list
      return data.item;
    } finally {
      setCreating(false);
    }
  };

  const updateItem = async (id: string, input: Partial<ClothingItemInput>) => {
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/wardrobe/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }

      const data = await response.json();
      await fetchItems(); // Refresh the list
      return data.item;
    } finally {
      setUpdating(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/wardrobe/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      await fetchItems(); // Refresh the list
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    total,
    creating,
    updating,
    deleting,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}

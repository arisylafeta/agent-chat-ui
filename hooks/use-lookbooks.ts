'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lookbook, LookbookInput } from '@/types/lookbook';
import { createClient } from '@/utils/supabase/client';

interface UseLookbooksOptions {
  limit?: number;
  offset?: number;
}

export function useLookbooks(options: UseLookbooksOptions = {}) {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);

  const supabase = createClient();

  const fetchLookbooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/lookbook/looks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lookbooks');
      }

      const data = await response.json();
      setLookbooks(data.lookbooks);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.offset, supabase.auth]);

  const createLookbook = async (input: LookbookInput) => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/lookbook/looks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lookbook');
      }

      const data = await response.json();
      await fetchLookbooks(); // Refresh the list
      return data.lookbook;
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchLookbooks();
  }, [fetchLookbooks]);

  return {
    lookbooks,
    loading,
    error,
    total,
    creating,
    refetch: fetchLookbooks,
    createLookbook,
  };
}

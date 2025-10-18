'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Avatar,
  GenerateAvatarData,
  GenerateAvatarResponse,
  SaveAvatarData,
  AvatarResponse,
  SaveAvatarResponse,
} from '@/types/lookbook';
import { createClient } from '@/utils/supabase/client';

export function useLookbook() {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchAvatar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/lookbook/avatar', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch avatar');
      }

      const data: AvatarResponse = await response.json();
      setAvatar(data.avatar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const generateAvatar = async (
    data: GenerateAvatarData
  ): Promise<GenerateAvatarResponse> => {
    setGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('headImage', data.headImage);
      formData.append('bodyImage', data.bodyImage);
      formData.append('measurements', JSON.stringify(data.measurements));
      if (data.regenerationNote) {
        formData.append('regenerationNote', data.regenerationNote);
      }

      const response = await fetch('/api/lookbook/generate-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate avatar');
      }

      const result: GenerateAvatarResponse = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const saveAvatar = async (data: SaveAvatarData): Promise<void> => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/lookbook/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save avatar');
      }

      const result: SaveAvatarResponse = await response.json();
      setAvatar(result.avatar);
      await fetchAvatar(); // Refresh avatar data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return {
    avatar,
    loading,
    error,
    generating,
    saving,
    fetchAvatar,
    generateAvatar,
    saveAvatar,
  };
}

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClothingItem, ClothingItemInput, clothingItemSchema } from '@/types/wardrobe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ClothingItemFormProps {
  open: boolean;
  item?: ClothingItem;
  onSubmit: (data: ClothingItemInput, image?: File) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const CATEGORIES = ['shirt', 'pants', 'dress', 'jacket', 'shoes', 'accessories', 'other'];

export function ClothingItemForm({
  open,
  item,
  onSubmit,
  onClose,
  loading = false,
}: ClothingItemFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item?.image_url || null
  );
  const [prettifyEnabled, setPrettifyEnabled] = useState(true); // Default to true
  const [prettifying, setPrettifying] = useState(false);
  const [prettifiedPreview, setPrettifiedPreview] = useState<string | null>(null);
  const [showPrettifyPreview, setShowPrettifyPreview] = useState(false);
  const [submittingAfterPreview, setSubmittingAfterPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ClothingItemInput>({
    resolver: zodResolver(clothingItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          brand: item.brand || undefined,
          colors: item.colors || undefined,
          fabrics: item.fabrics || undefined,
          seasons: item.seasons || undefined,
          price: item.price || undefined,
          dress_codes: item.dress_codes || undefined,
          gender: item.gender || undefined,
          size: item.size || undefined,
          notes: item.notes || undefined,
          tags: item.tags || undefined,
        }
      : {},
  });

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        category: item.category,
        brand: item.brand || undefined,
        colors: item.colors || undefined,
        fabrics: item.fabrics || undefined,
        seasons: item.seasons || undefined,
        price: item.price || undefined,
        dress_codes: item.dress_codes || undefined,
        gender: item.gender || undefined,
        size: item.size || undefined,
        notes: item.notes || undefined,
        tags: item.tags || undefined,
      });
      setImagePreview(item.image_url || null);
    } else {
      reset({});
      setImagePreview(null);
      setImageFile(null);
    }
  }, [item, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setPrettifiedPreview(null);
    setShowPrettifyPreview(false);
    setSubmittingAfterPreview(false);
    setPrettifyEnabled(true);
  };

  const onFormSubmit = async (data: ClothingItemInput) => {
    // Prevent multiple submissions
    if (loading || prettifying || submittingAfterPreview) {
      return;
    }

    // If prettify is enabled and we have an image, show preview first
    if (prettifyEnabled && imageFile && !prettifiedPreview) {
      try {
        setPrettifying(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('category', data.category);

        const response = await fetch('/api/wardrobe/prettify', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to prettify image');
        }

        const result = await response.json();
        setPrettifiedPreview(result.prettifiedImage);
        setShowPrettifyPreview(true);
        setPrettifying(false);
        return; // Stop here, wait for user to approve/reject
      } catch (error) {
        console.error('Prettify error:', error);
        setPrettifying(false);
        // Continue with original image if prettify fails
      }
    }

    // If we have a prettified preview, use it
    let finalImageFile = imageFile;
    if (prettifiedPreview) {
      const blob = await (await fetch(prettifiedPreview)).blob();
      finalImageFile = new File([blob], imageFile?.name || 'image.png', { 
        type: imageFile?.type || 'image/png' 
      });
    }

    await onSubmit(data, finalImageFile || undefined);
    
    // Close preview dialog and reset form after successful submission
    setShowPrettifyPreview(false);
    setSubmittingAfterPreview(false);
    resetForm();
  };

  const handleApprovePrettify = async () => {
    setSubmittingAfterPreview(true);
    // Re-submit the form with the prettified image
    await handleSubmit(onFormSubmit)();
  };

  const handleRejectPrettify = async () => {
    setPrettifiedPreview(null);
    setPrettifyEnabled(false);
    setSubmittingAfterPreview(true);
    // Re-submit with original
    await handleSubmit(onFormSubmit)();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Image</Label>
        {imagePreview ? (
          <div className="relative aspect-square w-full max-w-xs mx-auto">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-soft transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Blue denim jacket"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('category')}
          onValueChange={(value) => setValue('category', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat: string) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand">
          Brand <span className="text-red-500">*</span>
        </Label>
        <Input id="brand" {...register('brand')} placeholder="Nike" />
        {errors.brand && (
          <p className="text-sm text-red-500">{errors.brand.message}</p>
        )}
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label htmlFor="size">Size (Optional)</Label>
        <Input id="size" {...register('size')} placeholder="M, L, XL, etc." />
      </div>

      {/* AI-Populated Fields - Show when editing */}
      {item && (
        <>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              ✨ AI-Detected Attributes
            </p>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label htmlFor="colors">Colors (comma-separated)</Label>
            <Input
              id="colors"
              placeholder="blue, white, black"
              defaultValue={item?.colors?.join(', ')}
              onChange={(e) => {
                const colors = e.target.value
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean);
                setValue('colors', colors.length > 0 ? colors : undefined);
              }}
            />
          </div>

          {/* Fabrics */}
          <div className="space-y-2">
            <Label htmlFor="fabrics">Fabrics (comma-separated)</Label>
            <Input
              id="fabrics"
              placeholder="cotton, polyester, denim"
              defaultValue={item?.fabrics?.join(', ')}
              onChange={(e) => {
                const fabrics = e.target.value
                  .split(',')
                  .map((f) => f.trim())
                  .filter(Boolean);
                setValue('fabrics', fabrics.length > 0 ? fabrics : undefined);
              }}
            />
          </div>

          {/* Seasons */}
          <div className="space-y-2">
            <Label>Seasons</Label>
            <div className="flex flex-wrap gap-2">
              {['spring', 'summer', 'fall', 'winter'].map((season) => (
                <label
                  key={season}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={season}
                    defaultChecked={item?.seasons?.includes(season as any)}
                    onChange={(e) => {
                      const currentSeasons = watch('seasons') || [];
                      if (e.target.checked) {
                        setValue('seasons', [...currentSeasons, season as any]);
                      } else {
                        setValue(
                          'seasons',
                          currentSeasons.filter((s: string) => s !== season)
                        );
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{season}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="casual, vintage, summer"
              defaultValue={item?.tags?.join(', ')}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
                setValue('tags', tags.length > 0 ? tags : undefined);
              }}
            />
          </div>

          {/* Dress Codes */}
          <div className="space-y-2">
            <Label htmlFor="dress_codes">Dress Codes (comma-separated)</Label>
            <Input
              id="dress_codes"
              placeholder="casual, business casual, formal"
              defaultValue={item?.dress_codes?.join(', ')}
              onChange={(e) => {
                const codes = e.target.value
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean);
                setValue('dress_codes', codes.length > 0 ? codes : undefined);
              }}
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={watch('gender')}
              onValueChange={(value) => setValue('gender', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {['male', 'female', 'unisex'].map((gender) => (
                  <SelectItem key={gender} value={gender} className="capitalize">
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (Optional)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register('price', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : parseFloat(v)
              })}
              placeholder="99.99"
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
            />
          </div>
        </>
      )}

      {/* Prettify Toggle - Only show when creating */}
      {!item && (
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="prettify" className="text-base font-medium">
            <Sparkles className="mr-2 h-4 w-4 text-accent-2" />
          Prettify Image
          </Label>
          <p className="text-sm text-muted-foreground">
            Automatically enhance your photo with AI background removal and professional styling
          </p>
        </div>
        <Switch
          id="prettify"
          checked={prettifyEnabled}
          onCheckedChange={setPrettifyEnabled}
        />
      </div>
      )}

      {/* AI Backfill Notice - Only show when creating */}
      {!item && (
      <div className="rounded-lg bg-accent-1/10 border border-accent-1/20 p-4">
        <p className="text-sm text-muted-foreground">
          Additional details like colors, seasons, tags, and style attributes will be automatically detected and added by our AI.
        </p>
      </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading || prettifying || submittingAfterPreview}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || prettifying || submittingAfterPreview}>
          {(loading || prettifying || submittingAfterPreview) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {prettifying ? 'Prettifying...' : (loading || submittingAfterPreview) ? 'Saving...' : item ? 'Update' : 'Create'} Item
        </Button>
      </div>
        </form>
      </DialogContent>

      {/* Prettify Preview Dialog */}
      <Dialog open={showPrettifyPreview} onOpenChange={setShowPrettifyPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Prettified Image Only */}
            <div className="relative aspect-square w-full max-w-lg mx-auto border rounded-lg overflow-hidden bg-white">
              {prettifiedPreview && (
                <Image
                  src={prettifiedPreview}
                  alt="Prettified"
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={handleRejectPrettify}
              disabled={submittingAfterPreview || loading}
            >
              {submittingAfterPreview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Use Original
            </Button>
            <Button 
              onClick={handleApprovePrettify}
              disabled={submittingAfterPreview || loading}
            >
              {submittingAfterPreview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Use Prettified
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

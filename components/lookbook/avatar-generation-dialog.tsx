'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarMeasurements,
  GenerateAvatarResponse,
  bodyShapes,
  avatarMeasurementsSchema,
  type AvatarMeasurementsInput,
} from '@/types/lookbook';
import Image from 'next/image';

interface AvatarGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (avatarData: { avatarImageDataUrl: string; measurements: AvatarMeasurements }) => Promise<void>;
  onGenerate: (data: {
    headImage: File;
    bodyImage: File;
    measurements: AvatarMeasurements;
    regenerationNote?: string;
  }) => Promise<GenerateAvatarResponse>;
  existingAvatar?: Avatar | null;
}

type Step = 1 | 2 | 3 | 4;

export function AvatarGenerationDialog({
  open,
  onClose,
  onSave,
  onGenerate,
  existingAvatar,
}: AvatarGenerationDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [headImage, setHeadImage] = useState<File | null>(null);
  const [headImagePreview, setHeadImagePreview] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [bodyImagePreview, setBodyImagePreview] = useState<string | null>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [regenerationNote, setRegenerationNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const headInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset: resetForm,
  } = useForm<AvatarMeasurementsInput>({
    resolver: zodResolver(avatarMeasurementsSchema),
    defaultValues: existingAvatar?.measurements || {},
  });

  const measurements = watch();

  // Validate image file
  const validateImage = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, and WebP are allowed.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  // Handle head image selection
  const handleHeadImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      toast.error(error);
      return;
    }

    setHeadImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeadImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle body image selection
  const handleBodyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      toast.error(error);
      return;
    }

    setBodyImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBodyImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove head image
  const removeHeadImage = () => {
    setHeadImage(null);
    setHeadImagePreview(null);
    if (headInputRef.current) {
      headInputRef.current.value = '';
    }
  };

  // Remove body image
  const removeBodyImage = () => {
    setBodyImage(null);
    setBodyImagePreview(null);
    if (bodyInputRef.current) {
      bodyInputRef.current.value = '';
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep === 1 && !headImage) {
      toast.error('Please upload a head image');
      return;
    }
    if (currentStep === 2 && !bodyImage) {
      toast.error('Please upload a body image');
      return;
    }
    setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
  };

  // Navigate to previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  // Generate avatar
  const handleGenerateAvatar = async (data: AvatarMeasurementsInput) => {
    console.log('🔄 Generate Avatar button clicked');
    console.log('📊 Form data received:', data);
    console.log('🖼️ Head image present:', !!headImage);
    console.log('🖼️ Body image present:', !!bodyImage);

    // Validate required fields
    if (!headImage) {
      console.error('❌ Missing head image');
      toast.error('Head image is required');
      return;
    }

    if (!bodyImage) {
      console.error('❌ Missing body image');
      toast.error('Body image is required');
      return;
    }

    if (!data.height_cm) {
      console.error('❌ Missing height');
      toast.error('Height is required');
      return;
    }

    if (!data.weight_kg) {
      console.error('❌ Missing weight');
      toast.error('Weight is required');
      return;
    }

    console.log('✅ All validations passed, proceeding with generation');

    setIsGenerating(true);
    try {
      console.log('🚀 Calling onGenerate with data:', {
        hasHeadImage: !!headImage,
        hasBodyImage: !!bodyImage,
        measurements: data,
        regenerationNote: regenerationNote || 'none'
      });

      const result = await onGenerate({
        headImage,
        bodyImage,
        measurements: data as AvatarMeasurements,
        regenerationNote: regenerationNote || undefined,
      });

      console.log('✅ Avatar generation successful');
      setGeneratedAvatar(result.avatarImage);
      setCurrentStep(4);
      toast.success('Avatar generated successfully!');
    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate avatar');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate avatar with feedback
  const handleRegenerate = async () => {
    if (!headImage || !bodyImage) return;

    setIsGenerating(true);
    try {
      const result = await onGenerate({
        headImage,
        bodyImage,
        measurements: measurements as AvatarMeasurements,
        regenerationNote: regenerationNote || undefined,
      });

      setGeneratedAvatar(result.avatarImage);
      toast.success('Avatar regenerated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate avatar');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save avatar
  const handleSaveAvatar = async () => {
    if (!generatedAvatar) {
      toast.error('No avatar to save');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        avatarImageDataUrl: generatedAvatar,
        measurements: measurements as AvatarMeasurements,
      });

      toast.success('Avatar saved successfully!');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save avatar');
    } finally {
      setIsSaving(false);
    }
  };

  // Close dialog and reset state
  const handleClose = () => {
    setCurrentStep(1);
    setHeadImage(null);
    setHeadImagePreview(null);
    setBodyImage(null);
    setBodyImagePreview(null);
    setGeneratedAvatar(null);
    setRegenerationNote('');
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1 && 'Upload Head Photo'}
            {currentStep === 2 && 'Upload Body Photo'}
            {currentStep === 3 && 'Enter Measurements'}
            {currentStep === 4 && 'Preview Avatar'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 && 'Upload a clear photo of your face'}
            {currentStep === 2 && 'Upload a full body or torso photo'}
            {currentStep === 3 && 'Provide your body measurements for accurate avatar generation'}
            {currentStep === 4 && 'Review your generated avatar'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Head Image Upload */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-soft rounded-lg p-8 text-center">
                {headImagePreview ? (
                  <div className="relative flex justify-center">
                    <Image
                      src={headImagePreview}
                      alt="Head preview"
                      width={300}
                      height={300}
                      className="rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeHeadImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div
                      className="text-center cursor-pointer text-accent-2 hover:underline"
                      onClick={() => headInputRef.current?.click()}
                    >
                      Click to upload
                      <p className="text-sm text-gray-500 mt-1">JPEG, PNG, or WebP (max 10MB)</p>
                    </div>
                    <Input
                      id="head-image"
                      ref={headInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleHeadImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!headImage}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Body Image Upload */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-soft rounded-lg p-8 text-center">
                {bodyImagePreview ? (
                  <div className="relative flex justify-center">
                    <Image
                      src={bodyImagePreview}
                      alt="Body preview"
                      width={300}
                      height={300}
                      className="rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeBodyImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div
                      className="text-center cursor-pointer text-accent-2 hover:underline"
                      onClick={() => bodyInputRef.current?.click()}
                    >
                      Click to upload
                      <p className="text-sm text-gray-500 mt-1">JPEG, PNG, or WebP (max 10MB)</p>
                    </div>
                    <Input
                      id="body-image"
                      ref={bodyInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBodyImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext} disabled={!bodyImage}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Measurements Form */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit(handleGenerateAvatar)} className="space-y-4">
              {/* Validation Summary */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">Please complete required fields:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.height_cm && <li>• Height is required</li>}
                    {errors.weight_kg && <li>• Weight is required</li>}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      {...register('height_cm', { valueAsNumber: true })}
                      placeholder="175"
                    />
                    {errors.height_cm && (
                      <p className="text-sm text-red-500">{errors.height_cm.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      {...register('weight_kg', { valueAsNumber: true })}
                      placeholder="70"
                    />
                    {errors.weight_kg && (
                      <p className="text-sm text-red-500">{errors.weight_kg.message}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-soft pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    These measurements help us generate more accurate sizing recommendations
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="body_shape">Body Shape</Label>
                      <Select
                        value={measurements.body_shape}
                        onValueChange={(value) => setValue('body_shape', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select body shape" />
                        </SelectTrigger>
                        <SelectContent>
                          {bodyShapes.map((shape) => (
                            <SelectItem key={shape} value={shape}>
                              {shape.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chest">Chest/Bust (cm)</Label>
                        <Input
                          id="chest"
                          type="number"
                          step="0.01"
                          {...register('chest_cm')}
                          placeholder="90"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="waist">Waist (cm)</Label>
                        <Input
                          id="waist"
                          type="number"
                          step="0.01"
                          {...register('waist_cm')}
                          placeholder="75"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hips">Hips (cm)</Label>
                        <Input
                          id="hips"
                          type="number"
                          step="0.01"
                          {...register('hips_cm')}
                          placeholder="95"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shoulder">Shoulder Width (cm)</Label>
                        <Input
                          id="shoulder"
                          type="number"
                          step="0.01"
                          {...register('shoulder_width_cm')}
                          placeholder="45"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inseam">Inseam (cm)</Label>
                        <Input
                          id="inseam"
                          type="number"
                          step="0.01"
                          {...register('inseam_cm')}
                          placeholder="80"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const values = watch();
                      console.log('🔍 Form values:', values);
                      console.log('🔍 Form errors:', errors);
                      console.log('🔍 Has head image:', !!headImage);
                      console.log('🔍 Has body image:', !!bodyImage);
                      toast.info('Check console for form data');
                    }}
                  >
                    Debug
                  </Button>
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Avatar'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Step 4: Avatar Preview */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-accent-2" />
                  <p className="text-lg font-medium">Generating your avatar...</p>
                  <p className="text-sm text-gray-500">This may take up to 30 seconds</p>
                </div>
              ) : generatedAvatar ? (
                <>
                  <div className="border border-gray-soft rounded-lg p-4">
                    <Image
                      src={generatedAvatar}
                      alt="Generated avatar"
                      width={400}
                      height={400}
                      className="mx-auto rounded-lg object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Regeneration Feedback (optional)</Label>
                    <Textarea
                      id="feedback"
                      value={regenerationNote}
                      onChange={(e) => setRegenerationNote(e.target.value)}
                      placeholder="e.g., Make proportions more accurate, adjust lighting..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveAvatar} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Avatar'
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Click "Generate Avatar" to create your avatar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

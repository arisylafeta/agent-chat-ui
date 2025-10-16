# UI Components - Wardrobe Management

## Component Architecture

```
app/(chat)/wardrobe/page.tsx
  └─ WardrobePage (container)
      ├─ PageHeader
      │   └─ AddItemButton → opens AddItemDialog
      ├─ ClothingItemGrid
      │   ├─ EmptyWardrobe (when no items)
      │   └─ ClothingItemCard[] (when items exist)
      │       └─ onClick → opens ItemDetailView
      └─ AddItemDialog (modal)
          ├─ ImageUpload
          └─ ItemForm
      └─ ItemDetailView (modal)
          ├─ ItemDetails (read mode)
          └─ ItemEditForm (edit mode)
```

## Component Specifications

### 1. WardrobePage (Container)

**Location**: `app/(chat)/wardrobe/page.tsx`

**Purpose**: Main page component that orchestrates the wardrobe feature.

**Props**: None (uses URL params and auth context)

**State**:
```typescript
interface WardrobePageState {
  items: ClothingItem[];
  isLoading: boolean;
  error: Error | null;
  selectedItemId: string | null;
  isAddDialogOpen: boolean;
}
```

**Responsibilities**:
- Fetch clothing items on mount
- Manage dialog open/close state
- Handle optimistic updates
- Provide data to child components

**Example**:
```typescript
export default function WardrobePage() {
  const { items, isLoading, error, mutate } = useWardrobe();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader onAddClick={() => setIsAddDialogOpen(true)} />
      
      {isLoading && <LoadingSkeleton />}
      {error && <ErrorMessage error={error} />}
      
      {!isLoading && !error && (
        <ClothingItemGrid
          items={items}
          onItemClick={(id) => setSelectedItemId(id)}
        />
      )}
      
      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={mutate}
      />
      
      {selectedItemId && (
        <ItemDetailView
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onUpdate={mutate}
          onDelete={mutate}
        />
      )}
    </div>
  );
}
```

---

### 2. ClothingItemCard

**Location**: `components/wardrobe/clothing-item-card.tsx`

**Purpose**: Display a single clothing item in the grid.

**Props**:
```typescript
interface ClothingItemCardProps {
  item: ClothingItem;
  onClick: (id: string) => void;
}
```

**Styling**:
- Use shadcn `Card` component
- Thumbnail: 150x150px (aspect-square)
- Hover effect: subtle scale and shadow
- Follow styling.md conventions

**Accessibility**:
- Keyboard focusable
- Enter key triggers onClick
- Alt text for image

**Example**:
```typescript
export function ClothingItemCard({ item, onClick }: ClothingItemCardProps) {
  return (
    <Card
      className="cursor-pointer transition-transform hover:scale-105"
      onClick={() => onClick(item.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(item.id)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${item.name}`}
    >
      <CardContent className="p-4">
        <div className="aspect-square relative mb-3">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover rounded-md"
            sizes="150px"
          />
        </div>
        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{item.category}</p>
        {item.brand && (
          <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 3. ClothingItemGrid

**Location**: `components/wardrobe/clothing-item-grid.tsx`

**Purpose**: Responsive grid layout for clothing items.

**Props**:
```typescript
interface ClothingItemGridProps {
  items: ClothingItem[];
  onItemClick: (id: string) => void;
}
```

**Layout**:
- 2 columns on mobile (< 768px)
- 3 columns on tablet (768px - 1024px)
- 4 columns on desktop (> 1024px)
- Gap: 4 (1rem)

**Example**:
```typescript
export function ClothingItemGrid({ items, onItemClick }: ClothingItemGridProps) {
  if (items.length === 0) {
    return <EmptyWardrobe />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <ClothingItemCard
          key={item.id}
          item={item}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
```

---

### 4. EmptyWardrobe

**Location**: `components/wardrobe/empty-wardrobe.tsx`

**Purpose**: Display when user has no clothing items.

**Props**: None

**Content**:
- Icon (e.g., Shirt icon from Lucide)
- Heading: "Your wardrobe is empty"
- Description: "Start building your digital wardrobe by adding your first item"
- CTA button (optional, can trigger parent's add dialog)

**Example**:
```typescript
export function EmptyWardrobe() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Shirt className="size-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Your wardrobe is empty</h2>
      <p className="text-muted-foreground max-w-md">
        Start building your digital wardrobe by adding your first clothing item
      </p>
    </div>
  );
}
```

---

### 5. ImageUpload

**Location**: `components/wardrobe/image-upload.tsx`

**Purpose**: Handle image file selection with drag-and-drop.

**Props**:
```typescript
interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}
```

**Features**:
- Drag-and-drop zone
- Click to browse
- Camera capture (mobile)
- Image preview
- File validation (type, size)
- Error display

**Validation**:
- Allowed types: image/jpeg, image/png, image/webp
- Max size: 10MB
- Show error message if invalid

**Example**:
```typescript
export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onChange(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onChange(null);
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    onChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Image *</label>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging ? "border-accent-2 bg-accent-2/10" : "border-gray-soft",
          error && "border-red-500"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {preview ? (
          <div className="relative aspect-square max-w-xs mx-auto">
            <Image src={preview} alt="Preview" fill className="object-cover rounded-md" />
          </div>
        ) : (
          <>
            <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop an image, or click to browse
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              id="image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <label htmlFor="image-upload">
              <Button variant="outline" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

---

### 6. AddItemDialog

**Location**: `components/wardrobe/add-item-dialog.tsx`

**Purpose**: Modal dialog for adding new clothing items.

**Props**:
```typescript
interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

**Form Fields**:
- Image (ImageUpload) - required
- Name (Input) - required
- Category (Select) - required
- Brand (Input) - optional
- Prettify with AI (Switch) - optional

**Validation**:
- Use Zod schema from data-model.md
- Show inline errors
- Disable submit if invalid

**Behavior**:
- Show upload progress during submission
- Display success toast on completion
- Close dialog on success
- Reset form on close

**Example**:
```typescript
export function AddItemDialog({ open, onOpenChange, onSuccess }: AddItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ClothingItemCreate>({
    resolver: zodResolver(ClothingItemCreateSchema),
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      prettifyWithAI: true
    }
  });

  const onSubmit = async (data: ClothingItemCreate) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });

      const response = await fetch('/api/wardrobe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      toast.success('Item added successfully!');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Clothing Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ImageUpload
            value={form.watch('image')}
            onChange={(file) => form.setValue('image', file)}
            error={form.formState.errors.image?.message}
          />
          
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g., Blue Denim Jacket"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select {...form.register('category')}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shirt">Shirt</SelectItem>
                <SelectItem value="pants">Pants</SelectItem>
                <SelectItem value="jacket">Jacket</SelectItem>
                {/* ... more categories */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              {...form.register('brand')}
              placeholder="e.g., Levi's"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="prettify"
              {...form.register('prettifyWithAI')}
            />
            <Label htmlFor="prettify">Prettify with AI (coming soon)</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 7. ItemDetailView

**Location**: `components/wardrobe/item-detail-view.tsx`

**Purpose**: Modal for viewing and editing clothing item details.

**Props**:
```typescript
interface ItemDetailViewProps {
  itemId: string;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}
```

**Modes**:
- **View mode**: Display all fields (read-only)
- **Edit mode**: Editable form fields

**Features**:
- Toggle between view and edit modes
- Save changes (PATCH request)
- Delete item with confirmation
- Display all metadata fields
- Show enhanced image if available

**Layout**:
- Left: Large image display
- Right: Metadata fields

**Example**:
```typescript
export function ItemDetailView({ itemId, onClose, onUpdate, onDelete }: ItemDetailViewProps) {
  const { data, isLoading } = useSWR(`/api/wardrobe/${itemId}`);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (updates: Partial<ClothingItem>) => {
    await fetch(`/api/wardrobe/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    toast.success('Changes saved');
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await fetch(`/api/wardrobe/${itemId}`, { method: 'DELETE' });
    toast.success('Item deleted');
    onDelete();
    onClose();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{data.item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square relative">
            <Image
              src={data.item.enhanced_image_url || data.item.image_url}
              alt={data.item.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            {isEditing ? (
              <ItemEditForm item={data.item} onSave={handleSave} />
            ) : (
              <ItemDetails item={data.item} />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the clothing item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Shared Utilities

### useWardrobe Hook

**Location**: `hooks/use-wardrobe.ts`

```typescript
export function useWardrobe() {
  const { data, error, mutate } = useSWR<WardrobeListResponse>(
    '/api/wardrobe',
    fetcher
  );

  return {
    items: data?.items || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}
```

### useClothingItem Hook

**Location**: `hooks/use-clothing-item.ts`

```typescript
export function useClothingItem(id: string) {
  const { data, error, mutate } = useSWR<WardrobeItemResponse>(
    id ? `/api/wardrobe/${id}` : null,
    fetcher
  );

  return {
    item: data?.item,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}
```

## Styling Guidelines

All components must follow:
- Use Tailwind v4 tokens from `styling.md`
- Use shadcn/ui components where applicable
- Maintain consistent spacing (4, 6, 8 scale)
- Follow color palette (accent-1, accent-2, *-soft colors)
- Ensure WCAG AA contrast
- Responsive design (mobile-first)

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on icon buttons
- [ ] Alt text on images
- [ ] Form labels properly associated
- [ ] Error messages announced to screen readers
- [ ] Modal focus trap implemented
- [ ] ESC key closes modals
- [ ] Color contrast meets WCAG AA

# Wardrobe Management - Implementation Tasks

**Branch**: `001-wardrobe-management-feature`  
**Total**: 35 tasks | **Est. Time**: 2-3 weeks

## Legend
- **[P]** = Can run in parallel with other [P] tasks
- **Dependencies** = Must complete these first
- **Files** = Primary files to create/modify

---

## Phase 0: Setup (T001-T006) ✅ COMPLETE

### T001: Install Dependencies ✅
**Files**: `package.json`, `.env.local`  
**Deps**: None

```bash
pnpm add zod @google/generative-ai
```
Add `GEMINI_API_KEY` to `.env.local`

### T002 [P]: Database Migration ✅
**Files**: `supabase/migrations/*_create_clothing_items.sql`  
**Deps**: T001

Create `clothing_items` table with 16 fields. See `data-model.md` for SQL.

### T003 [P]: RLS Policies ✅
**Files**: `supabase/migrations/*_add_clothing_items_rls.sql`  
**Deps**: T002

Add 4 RLS policies (SELECT, INSERT, UPDATE, DELETE).

### T004 [P]: Storage Bucket ✅
**Files**: Supabase Dashboard  
**Deps**: T001

Create `clothing-images` bucket (private, 10MB max) + storage RLS policies.

### T005 [P]: TypeScript Types ✅
**Files**: `lib/db/wardrobe-types.ts`  
**Deps**: T002

Create `ClothingItem`, `WardrobeListResponse`, `PrettifyResponse` interfaces.

### T006 [P]: Zod Schemas ✅
**Files**: `lib/db/wardrobe-validation.ts`  
**Deps**: T005

Create validation schemas for create/update operations.

---

## Phase 1: API (T007-T013) ✅ COMPLETE

### T007: GET /api/wardrobe ✅
**Files**: `app/api/wardrobe/route.ts`  
**Deps**: T002, T003, T005, T006

List items with pagination, category filter. RLS enforced.

### T008: POST /api/wardrobe ✅
**Files**: `app/api/wardrobe/route.ts` (add POST)  
**Deps**: T007

Create item with image upload to Supabase Storage.

### T009 [P]: POST /api/wardrobe/prettify ✅
**Files**: `app/api/wardrobe/prettify/route.ts`  
**Deps**: T001, T006

Gemini AI integration. Returns prettified image as base64.

### T010 [P]: GET /api/wardrobe/[id] ✅
**Files**: `app/api/wardrobe/[id]/route.ts`  
**Deps**: T002, T003, T005

Fetch single item by ID.

### T011: PATCH /api/wardrobe/[id] ✅
**Files**: `app/api/wardrobe/[id]/route.ts` (add PATCH)  
**Deps**: T010

Update item fields.

### T012: DELETE /api/wardrobe/[id] ✅
**Files**: `app/api/wardrobe/[id]/route.ts` (add DELETE)  
**Deps**: T011

Delete item + image from storage.

### T013 [P]: Error Handling ✅
**Files**: `lib/api/error-handler.ts`  
**Deps**: T007-T012

Consistent error responses across all endpoints.

---

## Phase 2: UI Components (T014-T021)

### T014 [P]: Install shadcn Components
**Files**: `components/ui/*`  
**Deps**: T001

```bash
npx shadcn@latest add dialog button input select card badge switch
```

### T015 [P]: ClothingItemCard
**Files**: `components/wardrobe/clothing-item-card.tsx`  
**Deps**: T005, T014

Card component with image, name, category, brand. Keyboard accessible.

### T016 [P]: EmptyWardrobe
**Files**: `components/wardrobe/empty-wardrobe.tsx`  
**Deps**: T014

Empty state with icon and message.

### T017 [P]: ClothingItemGrid
**Files**: `components/wardrobe/clothing-item-grid.tsx`  
**Deps**: T015, T016

Responsive grid (2-4 cols). Shows empty state when no items.

### T018 [P]: ImageUpload
**Files**: `components/wardrobe/image-upload.tsx`  
**Deps**: T014

Drag-drop, file picker, camera capture. Client-side validation.

### T019 [P]: PrettifyResultView
**Files**: `components/wardrobe/prettify-result-view.tsx`  
**Deps**: T014

Shows prettified image with "Use AI Version" / "Use Original" buttons.

### T020: AddItemDialog
**Files**: `components/wardrobe/add-item-dialog.tsx`  
**Deps**: T018, T019

Form dialog with ImageUpload, name, category, brand fields. Prettify toggle. Calls T009 endpoint.

### T021 [P]: ItemDetailView
**Files**: `components/wardrobe/item-detail-view.tsx`  
**Deps**: T014

Modal with full image, all metadata, edit mode, delete button.

---

## Phase 3: Page Integration (T022-T027)

### T022: Create Wardrobe Page
**Files**: `app/(chat)/wardrobe/page.tsx`  
**Deps**: T017, T020, T021

Main page with grid, add button, dialogs.

### T023 [P]: useWardrobe Hook
**Files**: `hooks/use-wardrobe.ts`  
**Deps**: T007

SWR hook for fetching wardrobe items.

### T024 [P]: useClothingItem Hook
**Files**: `hooks/use-clothing-item.ts`  
**Deps**: T010

SWR hook for single item.

### T025: Wire Up AddItemDialog
**Files**: `app/(chat)/wardrobe/page.tsx` (update)  
**Deps**: T022, T023

Connect dialog to POST endpoint, handle prettify flow.

### T026: Wire Up ItemDetailView
**Files**: `app/(chat)/wardrobe/page.tsx` (update)  
**Deps**: T025, T024

Connect to PATCH/DELETE endpoints, optimistic updates.

### T027: Error Boundaries
**Files**: `app/(chat)/wardrobe/error.tsx`, `app/(chat)/wardrobe/loading.tsx`  
**Deps**: T022

Page-level error handling and loading states.

---

## Phase 4: Polish & Testing (T028-T035)

### T028 [P]: Keyboard Navigation
**Files**: Various components  
**Deps**: T022-T026

Ensure all interactive elements keyboard accessible.

### T029 [P]: ARIA Labels
**Files**: Various components  
**Deps**: T028

Add proper ARIA attributes, labels, descriptions.

### T030 [P]: Color Contrast Audit
**Files**: Various components  
**Deps**: T022-T026

Verify WCAG AA compliance. Test with contrast checker.

### T031 [P]: Image Optimization
**Files**: Various components  
**Deps**: T022-T026

Lazy loading, blur placeholders, responsive images.

### T032 [P]: Loading States
**Files**: Various components  
**Deps**: T022-T026

Skeletons, spinners, disabled states during async ops.

### T033: Manual QA Testing
**Files**: N/A  
**Deps**: T028-T032

Test all scenarios from `spec.md` QA section. Multiple browsers/devices.

### T034: Security Review
**Files**: N/A  
**Deps**: T033

Verify RLS policies, test unauthorized access, check XSS prevention.

### T035: Documentation
**Files**: `README.md`, inline comments  
**Deps**: T034

Update docs with setup instructions, API usage, component props.

---

## Parallel Execution Examples

**Setup Phase** (run simultaneously):
```bash
Task agent: "T002 - Create database migration"
Task agent: "T004 - Set up storage bucket"
Task agent: "T005 - Create TypeScript types"
```

**API Phase** (run simultaneously):
```bash
Task agent: "T009 - Create prettify endpoint"
Task agent: "T010 - Create GET [id] endpoint"
```

**UI Phase** (run simultaneously):
```bash
Task agent: "T015 - Create ClothingItemCard"
Task agent: "T016 - Create EmptyWardrobe"
Task agent: "T018 - Create ImageUpload"
Task agent: "T019 - Create PrettifyResultView"
```

---

## Testing Commands

```bash
# API tests
curl http://localhost:3000/api/wardrobe -H "Authorization: Bearer {token}"
curl -X POST http://localhost:3000/api/wardrobe -F "image=@test.jpg" -F "name=Test" -F "category=shirt"

# Run dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

---

## Success Criteria

- [ ] All 35 tasks completed
- [ ] All API endpoints functional
- [ ] All UI components render correctly
- [ ] RLS policies enforce user privacy
- [ ] Images upload/display properly
- [ ] Gemini AI prettify works
- [ ] Keyboard navigation works
- [ ] WCAG AA compliant
- [ ] Manual QA passed
- [ ] Security review passed

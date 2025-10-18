# Reoutfit Database Schema Evolution - Lookbook & Affiliate Integration

## Overview

This document outlines the comprehensive database schema updates implemented for the Reoutfit platform to support lookbook functionality, affiliate product integration, and enhanced wardrobe management. The schema evolution enables seamless mixing of user-uploaded items, affiliate products, and search results within outfit compositions.

## Schema Changes Summary

### Table Renaming
- **`clothing_items` → `wardrobe_items`**: Renamed for clarity and expanded with source tracking fields

### New Tables Added
- `affiliate_partners` - Partner management and commission tracking
- `affiliate_products` - Product catalog with pricing and metadata
- `search_results` - Ephemeral search result persistence
- `avatars` - User body measurements and preferences
- `lookbooks` - Outfit collection containers
- `lookbook_wardrobe_items` - Junction table for user items in lookbooks
- `lookbook_products` - Junction table for affiliate items in lookbooks
- `product_embeddings` - Vector search support for semantic matching

### New Enum Types
- `source_enum`: `user_upload`, `affiliate_product`, `search_result`
- `lookbook_layer`: `base`, `mid`, `outer`, `accessory`
- `lookbook_position`: `headwear`, `top`, `outerwear`, `bottom`, `footwear`, `bag`, `jewelry`, `other`
- `search_source`: `visual`, `shopping`, `affiliate`, `ai_generated`
- `lookbook_visibility`: `private`, `shared`, `public`

## Core Tables Detail

### wardrobe_items
**Purpose**: User-owned clothing items with enhanced source tracking

**Key Fields Added**:
- `source` (source_enum): Origin of the item (`user_upload`, `affiliate_product`, `search_result`)
- `source_ref_id` (UUID): References the original source record
- `affiliate_product_id` (UUID): Foreign key to affiliate catalog
- `search_result_id` (UUID): Foreign key to search capture

**Usage Patterns**:
- Source tracking enables provenance and attribution
- Foreign keys maintain data consistency when original sources are deleted
- Default source for new uploads: `user_upload`

### affiliate_partners
**Purpose**: Manage affiliate marketing relationships

**Key Fields**:
- `name`, `api_slug`, `website_url`
- `commission_rate` (NUMERIC): Track partner compensation

**Usage**: Powers affiliate link generation and revenue attribution

### affiliate_products
**Purpose**: Centralized product catalog from partner feeds

**Key Fields**:
- Partner relationship (`partner_id`)
- External product ID for sync management
- Full product metadata (pricing, URLs, attributes)
- `available` (BOOLEAN): Stock status
- Arrays for multi-value attributes (`colors`, `fabrics`, `seasons`, `tags`)

**Usage**: Search, recommendations, and affiliate link routing

### search_results
**Purpose**: Persist ephemeral search results for user curation

**Key Fields**:
- `source` (search_source): Search method (`visual`, `shopping`, `affiliate`, `ai_generated`)
- `image_url`: Direct link to product image
- `product_snapshot` (JSONB): Complete product metadata at time of search

**Usage**: 
- Enable users to save search results to wardrobe
- Support search result deduplication
- Analytics and performance tracking

### avatars
**Purpose**: Store user body measurements and style preferences

**Key Fields**:
- Physical measurements (`height_cm`, `weight_kg`, `body_shape`)
- `measurements` (JSONB): Detailed sizing data
- `preferences` (JSONB): Style preferences and constraints

**Usage**: 
- Personalized recommendations
- Size suggestions
- Virtual try-on features

### lookbooks
**Purpose**: Container for outfit compositions

**Key Fields**:
- `owner_id`: Creator of the lookbook
- `visibility` (lookbook_visibility): Access control
- `cover_image_url`: Preview image

**Usage**: 
- Social sharing features
- Personal style curation
- Shopping inspiration

### lookbook_wardrobe_items & lookbook_products
**Purpose**: Junction tables for outfit composition

**Key Fields**:
- `slot` (lookbook_layer): `base`, `mid`, `outer`, `accessory`
- `role` (lookbook_position): Specific garment position
- `note` (TEXT): User annotations

**Usage**:
- Layer-based outfit organization
- Position-specific garment assignment
- AI prompt generation for virtual styling

### product_embeddings
**Purpose**: Enable semantic search over product catalog

**Key Fields**:
- `affiliate_product_id`: Linked product
- `embedding` (vector): 1536-dimension vector representation
- `model`: Embedding model identifier

**Usage**:
- Semantic product search
- Style similarity matching
- Recommendation algorithms

## Key Design Decisions

### 1. Unified Wardrobe vs Separate Tables
**Decision**: Extended `wardrobe_items` with source tracking instead of separate tables
**Rationale**:
- Simplifies API surface and queries
- Enables unified search/filter operations across all item types
- Maintains data consistency with single source of truth
- Easier to implement "save to wardrobe" functionality

### 2. Junction Table Design for Lookbooks
**Decision**: Separate junction tables with layer/position enums
**Rationale**:
- Supports many-to-many relationships (item can be in multiple lookbooks)
- Layer/position enums enable structured outfit composition
- Notes field allows user customization
- Prepared for AI-generated outfit suggestions

### 3. Search Results as Ephemeral Storage
**Decision**: Dedicated table with image_url and JSONB snapshot
**Rationale**:
- Avoids duplicating product data
- Enables quick display of search results
- Supports attribution tracking when items are saved
- JSONB flexibility for varying product schemas

### 4. Enum-Based Layering System
**Decision**: `lookbook_layer` and `lookbook_position` enums
**Rationale**:
- Ensures consistent categorization
- Enables automated outfit generation prompts
- Supports filtering and sorting operations
- Future-proofs for new garment types

## Data Flow Patterns

### 1. Search → Wardrobe Save Flow
```
Search Results API → search_results table → User saves → wardrobe_items table
                                      ↓
                              affiliate_products (if external)
```

### 2. Lookbook Creation Flow
```
User selects items → lookbook_wardrobe_items or lookbook_products
                ↓
         Generate cover image → Update lookbooks.cover_image_url
```

### 3. Affiliate Product Sync Flow
```
Partner Feed → affiliate_products table → product_embeddings table
```

### 4. Avatar Integration Flow
```
User measurements → avatars table → Personalized recommendations
```

## API Considerations

### Wardrobe Endpoints
- `GET /api/wardrobe` - Filter by source type, category, etc.
- `POST /api/wardrobe` - Include source field in payload
- Enhanced filtering for mixed item types

### Lookbook Endpoints (Planned)
- `POST /api/lookbooks` - Create new lookbook
- `POST /api/lookbooks/{id}/items` - Add items to lookbook
- `GET /api/lookbooks/{id}/generate-image` - AI outfit visualization

### Search Endpoints (Planned)
- `POST /api/search` - Store results in search_results
- `POST /api/search/{resultId}/save` - Move to wardrobe

## Feature Planning Implications

### 1. Mixed Wardrobe Display
- UI components need to handle different source types
- Different action buttons based on source (buy vs. edit vs. remove)
- Unified filtering across all item types

### 2. Lookbook Composition
- Drag-and-drop interface with layer/position validation
- Real-time outfit preview generation
- Social sharing with visibility controls

### 3. Search Integration
- Save search results to wardrobe with proper attribution
- Search result caching and deduplication
- Performance optimizations for large result sets

### 4. Affiliate Attribution
- Commission tracking through partner links
- Revenue analytics and reporting
- Partner relationship management

### 5. AI Features
- Use layer/position data for prompt generation
- Semantic search using product embeddings
- Personalized recommendations based on avatar data

## Migration Notes

### Applied Changes
- Table rename: `clothing_items` → `wardrobe_items`
- Added source tracking columns
- Created all new tables with proper relationships
- Applied comprehensive RLS policies
- Maintained backwards compatibility in TypeScript types

### Code Updates Required
- API routes updated to use `wardrobe_items`
- TypeScript interfaces extended with new fields
- Component logic adapted for source-aware functionality

### Future Migrations
- Vector embedding population for existing products
- Avatar data migration from user profiles
- Lookbook creation from existing outfit collections

## Performance Considerations

### Indexes Added
- User-based indexes on all user-owned tables
- Category and availability filters
- Foreign key constraints with cascading deletes

### Query Patterns Optimized
- Wardrobe listing with source filtering
- Lookbook item retrieval with joins
- Search result cleanup (time-based expiration)

### Future Optimizations
- Partitioning for large product catalogs
- Materialized views for complex joins
- Caching strategies for frequently accessed items

## Security Model

### RLS Policies Applied
- **wardrobe_items**: User isolation (full CRUD)
- **search_results**: User isolation (full CRUD)
- **avatars**: User isolation (full CRUD)
- **lookbooks**: Owner control + visibility-based access
- **affiliate_products**: Public read, admin write
- **product_embeddings**: Public read for search

### Data Protection
- Image URLs stored securely in Supabase Storage
- User data isolated by auth.uid()
- Affiliate links tracked for attribution
- Search history privacy maintained

## Next Steps

### Immediate Implementation
1. Update remaining component references to new types
2. Implement lookbook CRUD operations
3. Build mixed wardrobe display components
4. Add affiliate product search integration

### Medium-term Features
1. AI outfit generation using layer/position data
2. Social sharing and lookbook discovery
3. Advanced search with semantic matching
4. Virtual try-on with avatar integration

### Long-term Vision
1. Revenue optimization through affiliate partnerships
2. Machine learning personalization
3. Community-driven style curation
4. Cross-platform wardrobe synchronization

---

*This document serves as the technical foundation for all Reoutfit features requiring database access. All new development should reference this schema and maintain compatibility with the established patterns.*

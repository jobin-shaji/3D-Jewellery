# 3D Marketplace Database Schema

## Overview
This document outlines the complete database schema for the 3D Marketplace application using MongoDB with Mongoose ODM.

## Collections

### 1. Users Collection
**Collection Name:** `users`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | id | String(10) | Unique | Auto-generated | Custom user identifier (u + 5-digit random) |
| 3 | name | String(100) | - | Not Null | Full name of the user |
| 4 | email | String(255) | Unique | Not Null | Email address for login |
| 5 | password | String(255) | - | Not Null | Hashed password |
| 6 | authProvider | String(10) | - | Default 'local' | Authentication method (local/google) |
| 7 | role | String(10) | - | Default 'client' | User role (admin/client) |
| 8 | isActive | Boolean | - | Default true | Account status |
| 9 | wishlist | Array | - | Nullable | Array of wishlist items |
| 10 | wishlist.productId | String(50) | - | Not Null | Product ID in wishlist |
| 11 | wishlist.addedAt | DateTime | - | Default now | When added to wishlist |
| 12 | createdAt | DateTime | - | Default now | Account creation timestamp |
| 13 | updatedAt | DateTime | - | Default now | Last update timestamp |

---

### 2. Products Collection
**Collection Name:** `products`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | id | String(50) | Unique | Auto-generated | Custom product identifier |
| 3 | name | String(200) | - | Not Null | Product name |
| 4 | makingPrice | Number | - | Not Null, Min 0 | Base making price |
| 5 | category_id | Number | Foreign Key | Not Null | References categories collection |
| 6 | description | String(1000) | - | Not Null | Product description |
| 7 | stock_quantity | Number | - | Default 0, Min 0 | Available stock |
| 8 | is_active | Boolean | - | Default true | Product availability status |
| 9 | is_deleted | Boolean | - | Default false | Soft delete flag |
| 10 | deleted_at | DateTime | - | Nullable | Deletion timestamp |
| 11 | deleted_by | String(50) | - | Nullable | Who deleted the product |
| 12 | model_3d_url | String(500) | - | Nullable | 3D model file URL |

#### Product Metals (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | type | String(50) | - | Not Null | Metal type (Gold, Silver, Platinum) |
| 2 | purity | String(20) | - | Not Null | Metal purity (18k, 14k, 925) |
| 3 | weight | Number | - | Not Null, Min 0 | Weight in grams |
| 4 | color | String(20) | - | Nullable | Metal color (White, Yellow, Rose) |

#### Product Gemstones (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | type | String(50) | - | Not Null | Gemstone type (Diamond, Ruby, etc.) |
| 2 | carat | Number | - | Not Null, Min 0 | Carat weight |
| 3 | color | String(20) | - | Nullable | Gemstone color grade |
| 4 | clarity | String(20) | - | Nullable | Clarity grade (FL, IF, VVS1) |
| 5 | count | Number | - | Not Null, Min 1, Default 1 | Number of stones |
| 6 | shape | String(20) | - | Nullable | Stone shape (Round, Oval, Pear) |
| 7 | price | Number | - | Not Null, Min 0 | Price per carat or total |

#### Product Images (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | image_url | String(500) | - | Not Null | Image URL |
| 2 | alt_text | String(200) | - | Nullable | Alt text for accessibility |
| 3 | is_primary | Boolean | - | Default false | Primary image flag |
| 4 | sort_order | Number | - | Not Null, Min 0 | Display order |

#### Product Certificates (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | name | String(100) | - | Not Null | Certificate name |
| 2 | file_url | String(500) | - | Not Null | Certificate file URL |

---

### 3. Orders Collection
**Collection Name:** `orders`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | orderId | String(20) | Unique | Auto-generated | Custom order identifier (ORD-YYYY-XXXXXX) |
| 3 | userId | String(50) | Foreign Key | Not Null | References users collection |
| 4 | subtotal | Number | - | Not Null, Min 0 | Order subtotal amount |
| 5 | tax | Number | - | Default 0, Min 0 | Tax amount |
| 6 | shippingFee | Number | - | Default 0, Min 0 | Shipping cost |
| 7 | totalPrice | Number | - | Not Null, Min 0 | Final total amount |

#### Shipping Address (Embedded Object)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | name | String(100) | - | Not Null | Recipient full name |
| 2 | street | String(200) | - | Not Null | Street address |
| 3 | city | String(100) | - | Not Null | City name |
| 4 | state | String(100) | - | Not Null | State or province |
| 5 | postalCode | String(20) | - | Not Null | ZIP or postal code |
| 6 | country | String(100) | - | Not Null | Country name |
| 7 | phone | String(20) | - | Nullable | Contact phone number |

#### Order Items (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | product | Object | - | Not Null | Complete product snapshot at order time |
| 2 | variant | Object | - | Nullable | Product variant snapshot |
| 3 | quantity | Number | - | Not Null, Min 1 | Ordered quantity |
| 4 | price | Number | - | Not Null, Min 0 | Item price at time of order |

#### Payment Information (Embedded Object)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | method | String(20) | - | Not Null | Payment method type |
| 2 | transactionId | String(100) | - | Nullable | Payment gateway transaction ID |
| 3 | paymentStatus | String(20) | - | Not Null | Current payment status |

**Payment Methods:** credit_card, debit_card, paypal, stripe, razorpay, bank_transfer

---

### 4. Cart Collection
**Collection Name:** `carts`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | userId | String(50) | Unique | Not Null | User identifier (one cart per user) |
| 3 | totalItems | Number | - | Default 0, Min 0 | Total item count in cart |
| 4 | totalAmount | Number | - | Default 0, Min 0 | Total cart value |

#### Cart Items (Embedded Array)
| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | productId | String(50) | - | Not Null | Product identifier |
| 2 | variant_id | String(50) | - | Nullable | Product variant ID |
| 3 | name | String(200) | - | Not Null | Product name |
| 4 | totalprice | Number | - | Not Null, Min 0 | Item total price |
| 5 | quantity | Number | - | Not Null, Min 1, Default 1 | Item quantity |

---

### 5. Categories Collection
**Collection Name:** `categories`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | id | Number | Unique | Not Null | Custom category identifier |
| 3 | name | String(100) | - | Not Null | Category name |
| 4 | description | String(500) | - | Nullable | Category description |
| 5 | image_url | String(500) | - | Nullable | Category image URL |
| 6 | parent_id | Number | Foreign Key | Nullable | Parent category ID for hierarchy |
| 7 | is_active | Boolean | - | Default true | Category status |
| 8 | sort_order | Number | - | Default 0 | Display order |
| 9 | createdAt | DateTime | - | Default now | Creation timestamp |
| 10 | updatedAt | DateTime | - | Default now | Last update timestamp |

**Virtual Fields:**
- `children`: Referenced child categories

---

### 6. Addresses Collection
**Collection Name:** `addresses`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | id | String(20) | Unique | Auto-generated | Custom address identifier (addr + 5-digit) |
| 3 | userId | String(50) | Foreign Key | Not Null | References users collection |
| 4 | title | String(50) | - | Not Null | Address title or label |
| 5 | firstName | String(50) | - | Not Null | First name |
| 6 | lastName | String(50) | - | Not Null | Last name |
| 7 | phone | String(20) | - | Not Null | Contact phone number |
| 8 | addressLine1 | String(200) | - | Not Null | Primary address line |
| 9 | addressLine2 | String(200) | - | Nullable | Secondary address line |
| 10 | city | String(100) | - | Not Null | City name |
| 11 | state | String(100) | - | Not Null | State or province |
| 12 | postalCode | String(20) | - | Not Null | ZIP or postal code |
| 13 | country | String(100) | - | Not Null | Country name |
| 14 | isDefault | Boolean | - | Default false | Default address flag |

---

### 7. Metals Collection
**Collection Name:** `metals`

| No | Field Name | Datatype (Size) | Key | Constraints | Description |
|----|------------|----------------|-----|-------------|-------------|
| 1 | _id | ObjectId | Primary Key | Auto-generated | MongoDB default primary key |
| 2 | metal | String(20) | Composite Key | Not Null | Metal type (Gold, Silver, Platinum, Palladium) |
| 3 | purity | String(10) | Composite Key | Not Null | Metal purity specification |
| 4 | pricePerGram | Number | - | Not Null, Min 0 | Current price per gram |
| 5 | change | Number | - | Default 0 | Price change percentage |
| 6 | absoluteChange | Number | - | Default 0 | Absolute price change amount |
| 7 | source | String(20) | - | Default 'manual' | Price data source |
| 8 | updatedAt | DateTime | - | Default now | Last price update timestamp |
| 9 | createdAt | DateTime | - | Default now | Record creation timestamp |

**Metal Types:** Gold, Silver, Platinum, Palladium  
**Price Sources:** manual, api, calculated

---

## Relationships

### One-to-Many Relationships
- **Users → Addresses**: One user can have multiple addresses
- **Users → Orders**: One user can have multiple orders
- **Categories → Products**: One category can contain multiple products
- **Categories → Categories**: Parent-child category hierarchy

### One-to-One Relationships
- **Users → Cart**: One user has one cart

### Referenced Relationships
- `orders.userId` → `users.id`
- `addresses.userId` → `users.id`
- `carts.userId` → `users.id`
- `products.category_id` → `categories.id`
- `categories.parent_id` → `categories.id`

### Embedded Documents
- Product metals, gemstones, images, certificates are embedded in products
- Cart items are embedded in cart documents
- Order items and shipping address are embedded in orders
- Wishlist items are embedded in user documents

## Database Indexes

### Primary Key Indexes
| Collection | Field | Type | Description |
|------------|-------|------|-------------|
| users | _id | ObjectId | MongoDB default primary key |
| products | _id | ObjectId | MongoDB default primary key |
| orders | _id | ObjectId | MongoDB default primary key |
| carts | _id | ObjectId | MongoDB default primary key |
| categories | _id | ObjectId | MongoDB default primary key |
| addresses | _id | ObjectId | MongoDB default primary key |
| metals | _id | ObjectId | MongoDB default primary key |

### Unique Indexes
| Collection | Field(s) | Description |
|------------|----------|-------------|
| users | email | Ensures unique email addresses |
| users | id | Custom user identifier |
| products | id | Custom product identifier |
| orders | orderId | Custom order identifier |
| carts | userId | One cart per user |
| categories | id | Custom category identifier |
| addresses | id | Custom address identifier |
| metals | metal + purity | Unique metal-purity combinations |

### Performance Indexes
| Collection | Field | Type | Purpose |
|------------|-------|------|---------|
| addresses | userId | Single | Query user addresses efficiently |
| metals | updatedAt | Descending | Sort by last update time |
| orders | userId | Single | Query user orders efficiently |

## Notes

1. **Soft Deletes**: Products use soft delete with `is_deleted` flag
2. **Timestamps**: Most collections use automatic `createdAt` and `updatedAt`
3. **Custom IDs**: User, address, and order collections use custom ID generation
4. **Embedded vs Referenced**: Heavy use of embedded documents for related data
5. **Validation**: Extensive use of Mongoose validators for data integrity
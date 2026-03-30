# 3D Marketplace Database Schema - Table Format

## Users Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	user_id	String(10)	Primary Key, Auto-generated	Custom user identifier (u + 5-digit random)
2	name	String(100)	Not Null	Full name of the user
3	email	String(255)	Unique, Not Null	Email address for login
4	password	String(255)	Not Null	Hashed password
5	authProvider	String(10)	Default 'local'	Authentication method (local/google)
6	role	String(10)	Default 'client'	User role (admin/client)
7	isActive	Boolean	Default true	Account status
8	wishlist	Array	Nullable	Array of wishlist items
9	wishlist_item_id	String(50)	Primary Key, Auto-generated	Unique identifier for wishlist item
10	user_id	String(50)	Foreign Key, Not Null	References parent user
11	wishlist.product_id	String(50)	Foreign Key	Product ID in wishlist
12	wishlist.addedAt	DateTime	Default now	When added to wishlist
13	createdAt	DateTime	Default now	Account creation timestamp
14	updatedAt	DateTime	Default now	Last update timestamp

## Products Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	product_id	String(50)	Primary Key, Auto-generated	Custom product identifier
2	name	String(200)	Not Null	Product name
3	makingPrice	Number	Not Null, Min 0	Base making price
4	category_id	Number	Foreign Key, Not Null	References categories collection
5	description	String(1000)	Not Null	Product description
6	stock_quantity	Number	Default 0, Min 0	Available stock
7	is_active	Boolean	Default true	Product availability status
8	is_deleted	Boolean	Default false	Soft delete flag
9	deleted_at	DateTime	Nullable	Deletion timestamp
10	deleted_by	String(50)	Nullable	Who deleted the product
11	model_3d_url	String(500)	Nullable	3D model file URL

### Product Metals (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	metal_item_id	String(50)	Primary Key, Auto-generated	Unique identifier for metal item
2	product_id	String(50)	Foreign Key, Not Null	References parent product
3	type	String(50)	Not Null	Metal type (Gold, Silver, Platinum)
4	purity	String(20)	Not Null	Metal purity (18k, 14k, 925)
5	weight	Number	Not Null, Min 0	Weight in grams
6	color	String(20)	Nullable	Metal color (White, Yellow, Rose)

### Product Gemstones (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	gemstone_id	String(50)	Primary Key, Auto-generated	Unique identifier for gemstone
2	product_id	String(50)	Foreign Key, Not Null	References parent product
3	type	String(50)	Not Null	Gemstone type (Diamond, Ruby, etc.)
4	carat	Number	Not Null, Min 0	Carat weight
5	color	String(20)	Nullable	Gemstone color grade
6	clarity	String(20)	Nullable	Clarity grade (FL, IF, VVS1)
7	count	Number	Not Null, Min 1, Default 1	Number of stones
8	shape	String(20)	Nullable	Stone shape (Round, Oval, Pear)
9	price	Number	Not Null, Min 0	Price per carat or total

### Product Images (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	image_id	String(50)	Primary Key, Auto-generated	Unique identifier for image
2	product_id	String(50)	Foreign Key, Not Null	References parent product
3	image_url	String(500)	Not Null	Image URL
4	alt_text	String(200)	Nullable	Alt text for accessibility
5	is_primary	Boolean	Default false	Primary image flag
6	sort_order	Number	Not Null, Min 0	Display order

### Product Certificates (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	certificate_id	String(50)	Primary Key, Auto-generated	Unique identifier for certificate
2	product_id	String(50)	Foreign Key, Not Null	References parent product
3	name	String(100)	Not Null	Certificate name
4	file_url	String(500)	Not Null	Certificate file URL

## Orders Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	order_id	String(20)	Primary Key, Auto-generated	Custom order identifier (ORD-YYYY-XXXXXX)
2	user_id	String(50)	Foreign Key, Not Null	References users collection
3	subtotal	Number	Not Null, Min 0	Order subtotal amount
4	tax	Number	Default 0, Min 0	Tax amount
5	shippingFee	Number	Default 0, Min 0	Shipping cost
6	totalPrice	Number	Not Null, Min 0	Final total amount

### Shipping Address (Embedded Object)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	shipping_address_id	String(50)	Primary Key, Auto-generated	Unique identifier for shipping address
2	order_id	String(20)	Foreign Key, Not Null	References parent order
3	name	String(100)	Not Null	Recipient full name
4	street	String(200)	Not Null	Street address
5	city	String(100)	Not Null	City name
6	state	String(100)	Not Null	State or province
7	postalCode	String(20)	Not Null	ZIP or postal code
8	country	String(100)	Not Null	Country name
9	phone	String(20)	Nullable	Contact phone number

### Order Items (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	order_item_id	String(50)	Primary Key, Auto-generated	Unique identifier for order item
2	order_id	String(20)	Foreign Key, Not Null	References parent order
3	product	Object	Not Null	Complete product snapshot at order time
4	variant	Object	Nullable	Product variant snapshot
5	quantity	Number	Not Null, Min 1	Ordered quantity
6	price	Number	Not Null, Min 0	Item price at time of order

### Payment Information (Embedded Object)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	payment_id	String(50)	Primary Key, Auto-generated	Unique identifier for payment
2	order_id	String(20)	Foreign Key, Not Null	References parent order
3	method	String(20)	Not Null	Payment method type
4	transactionId	String(100)	Nullable	Payment gateway transaction ID
5	paymentStatus	String(20)	Not Null	Current payment status

## Cart Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	cart_id	String(50)	Primary Key, Auto-generated	Custom cart identifier
2	user_id	String(50)	Foreign Key, Not Null	User identifier (one cart per user)
3	totalItems	Number	Default 0, Min 0	Total item count in cart
4	totalAmount	Number	Default 0, Min 0	Total cart value

### Cart Items (Embedded Array)

No	Field Name	Datatype (Size)	Key Constraints	Description
1	cart_item_id	String(50)	Primary Key, Auto-generated	Unique identifier for cart item
2	cart_id	String(50)	Foreign Key, Not Null	References parent cart
3	product_id	String(50)	Foreign Key	Product identifier
4	variant_id	String(50)	Nullable	Product variant ID
5	name	String(200)	Not Null	Product name
6	totalprice	Number	Not Null, Min 0	Item total price
7	quantity	Number	Not Null, Min 1, Default 1	Item quantity

## Categories Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	category_id	Number	Primary Key, Not Null	Custom category identifier
2	name	String(100)	Not Null	Category name
3	description	String(500)	Nullable	Category description
4	image_url	String(500)	Nullable	Category image URL
5	parent_category_id	Number	Foreign Key, Nullable	Parent category ID for hierarchy
6	is_active	Boolean	Default true	Category status
7	sort_order	Number	Default 0	Display order
8	createdAt	DateTime	Default now	Creation timestamp
9	updatedAt	DateTime	Default now	Last update timestamp

## Addresses Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	address_id	String(20)	Primary Key, Auto-generated	Custom address identifier (addr + 5-digit)
2	user_id	String(50)	Foreign Key, Not Null	References users collection
3	title	String(50)	Not Null	Address title or label
4	firstName	String(50)	Not Null	First name
5	lastName	String(50)	Not Null	Last name
6	phone	String(20)	Not Null	Contact phone number
7	addressLine1	String(200)	Not Null	Primary address line
8	addressLine2	String(200)	Nullable	Secondary address line
9	city	String(100)	Not Null	City name
10	state	String(100)	Not Null	State or province
11	postalCode	String(20)	Not Null	ZIP or postal code
12	country	String(100)	Not Null	Country name
13	isDefault	Boolean	Default false	Default address flag

## Metals Collection

No	Field Name	Datatype (Size)	Key Constraints	Description
1	metal_id	String(50)	Primary Key, Auto-generated	Custom metal identifier
2	metal	String(20)	Not Null	Metal type (Gold, Silver, Platinum, Palladium)
3	purity	String(10)	Not Null	Metal purity specification
4	pricePerGram	Number	Not Null, Min 0	Current price per gram
5	change	Number	Default 0	Price change percentage
6	absoluteChange	Number	Default 0	Absolute price change amount
7	source	String(20)	Default 'manual'	Price data source
8	updatedAt	DateTime	Default now	Last price update timestamp
9	createdAt	DateTime	Default now	Record creation timestamp

## Conclusion

The 3D Marketplace has been successfully developed to offer a comprehensive and innovative platform for jewelry and precious metal product management. Users can explore products through the interactive 3D Product Catalog, filter items using advanced search capabilities, save favorites in their Wishlist, and manage purchases via the intuitive Cart System and secure Checkout features. The platform provides automated Order Confirmation and tracking, comprehensive Order Management, and real-time Metal Price updates to ensure informed purchasing decisions. 

Users can browse detailed product specifications including metals, gemstones, and certificates, while experiencing immersive 3D visualization of jewelry items. The robust Address Management system allows multiple shipping locations, and the secure Payment Processing ensures safe transactions through multiple payment gateways including Razorpay.

The Admin Dashboard enables seamless management of users, orders, inventory, and product categories, while the Analytics Service provides valuable insights into user behavior and sales performance. The platform supports both traditional web access and mobile applications, with serverless deployment options for scalability.

Overall, the 3D Marketplace enhances the jewelry shopping experience by combining cutting-edge 3D visualization technology, comprehensive product information, secure transaction processing, and personalized user management. The platform bridges the gap between traditional jewelry shopping and modern e-commerce, providing customers with an immersive and trustworthy online jewelry purchasing experience.

## Future Scope

The 3D Marketplace platform offers significant opportunities for enhancement and expansion. Future developments could include AI-powered recommendation systems that analyze user preferences and purchase history to suggest personalized jewelry collections. Integration of Augmented Reality (AR) features would allow customers to virtually try on jewelry pieces using their mobile cameras, creating an even more immersive shopping experience.

Advanced customization tools could enable users to modify existing designs or create entirely custom jewelry pieces with real-time 3D rendering and pricing calculations. Machine learning algorithms could optimize inventory management by predicting demand patterns and seasonal trends.

Additional features might include blockchain integration for jewelry authenticity certificates, social sharing capabilities for favorite designs, virtual jewelry consultations with experts, and expansion into luxury watches and gemstone trading. Multi-language support and cryptocurrency payment options could broaden the platform's global reach, while advanced analytics could provide deeper insights into market trends and customer behavior patterns.
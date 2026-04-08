const express = require('express');
const multer = require('multer');
const Product = require('../models/product');
const { authenticateToken, isAdmin } = require('../utils/jwt');
const { computeProductPrice} = require('../utils/priceUtils');
const { uploadImage, uploadCertificate, uploadModel } = require('../utils/uploadConfig');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with primary images
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get all active products with limit for performance
    const products = await Product.find({ is_active: true, is_deleted: false })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(50);

    // Add primary image for each product
    const productsWithImages = products.map(product => {
      const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
      
      return {
        ...product.toObject(),
        primaryImage: primaryImage
      };
    });

    // Trigger background batch price update in-process if many products have stale `latestPriceUpdate`
    try {
      const PRICE_REFRESH_HOURS = Number(process.env.PRICE_REFRESH_HOURS) || 4;
      const staleThreshold = new Date(Date.now() - PRICE_REFRESH_HOURS * 60 * 60 * 1000);
      const staleCount = await Product.countDocuments({ is_active: true, is_deleted: false, $or: [ { latestPriceUpdate: { $lt: staleThreshold } }, { latestPriceUpdate: null } ] });
      if (staleCount > 0) {
        // Fire-and-forget: run update in the same process without blocking the response
        (async () => {
          try {
            const limit = 100; // cap per run to avoid long blocking work
            const staleProducts = await Product.find({ is_active: true, is_deleted: false, $or: [ { latestPriceUpdate: { $lt: staleThreshold } }, { latestPriceUpdate: null } ] }).limit(limit);
            let updated = 0;
            for (const p of staleProducts) {
              try {
                const res = await computeProductPrice(p);
                if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                  // Use the first result (base product or first variant) for the main totalPrice
                  const basePricing = res.data[0];
                  p.totalPrice = Math.round(basePricing.subtotal || 0);
                  
                  // Update variant prices if variants exist
                  if (p.variants && p.variants.length > 0) {
                    for (const variant of p.variants) {
                      const variantPricing = res.data.find(item => item.variant_id === variant.variant_id);
                      if (variantPricing) {
                        variant.totalPrice = Math.round(variantPricing.subtotal || 0);
                      }
                    }
                  }
                  
                  p.latestPriceUpdate = new Date();
                  await p.save();
                  updated++;
                }
              } catch (err) {
                console.error('Error updating product price in background for', p.id, err);
              }
            }
            console.log(`Background price update completed. Updated ${updated} products.`);
          } catch (err) {
            console.error('Background price updater failed', err);
          }
        })();
      }

    } catch (bgErr) {
      console.error('Error evaluating background price update:', bgErr);
    }

    res.json({
      products: productsWithImages,
      pagination: {
        page: 1,
        limit: products.length,
        total: products.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with primary images
 * @access  admin
 */
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get all non-deleted products (even admins don't see deleted ones)
    const products = await Product.find({ is_deleted: false })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(50);

    // Add primary image for each product
    const productsWithImages = products.map(product => {
      const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
      
      return {
        ...product.toObject(),
        primaryImage: primaryImage
      };
    });

    res.json({
      products: productsWithImages,
      pagination: {
        page: 1,
        limit: products.length,
        total: products.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product (only if not deleted)
    const product = await Product.findOne({ id: productId, is_deleted: false });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product fetched successfully',
      product: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/products/:id/full
 * @desc    Get product with images populated
 * @access  Public
 */
router.get('/:id/full', async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product (only if not deleted)
    const product = await Product.findOne({ id: productId, is_deleted: false })
      .populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get primary image (first image or one marked as primary)
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

    res.json({
      ...product.toObject(),
      primaryImage: primaryImage
    });

  } catch (error) {
    console.error('Get product full error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product (admin only)
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    let { 
      name, 
      makingPrice, 
      category_id, 
      description = '',
      is_active = true,
      variants = [],
      metals = [],
      gemstones = [],
      stock_quantity = 0,
      reconstruction_job_id = null,
      reconstruction_status = null
    } = req.body;

    // Parse possible string fields
    makingPrice = Number(makingPrice);
    stock_quantity = Number(stock_quantity);
    
    // if your category_id is numeric in DB:
    // category_id = isNaN(Number(category_id)) ? category_id : Number(category_id);
    category_id = Number(category_id);

    // Parse JSON if front-end sent strings
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    if (typeof metals === 'string') {
      try { metals = JSON.parse(metals); } catch (e) { metals = []; }
    }
    if (typeof gemstones === 'string') {
      try { gemstones = JSON.parse(gemstones); } catch (e) { gemstones = []; }
    }

    // Validation
    if (!name || !category_id) {
      return res.status(400).json({ message: 'Name and category are required' });
    }
    if (!Number.isFinite(stock_quantity) || stock_quantity < 0) {
      return res.status(400).json({ message: 'stock_quantity must be a non-negative number' });
    }

    // Validate metals array
    if (metals && Array.isArray(metals)) {
      for (const metal of metals) {
        if (!metal.type || !metal.purity || !metal.weight || metal.weight <= 0) {
          return res.status(400).json({ 
            message: 'Each metal must have type, purity, and weight > 0' 
          });
        }
      }
    }

    // Validate gemstones array
    if (gemstones && Array.isArray(gemstones)) {
      for (const gemstone of gemstones) {
        if (!gemstone.type || !gemstone.carat || gemstone.carat <= 0 || !gemstone.count || gemstone.count <= 0) {
          return res.status(400).json({ 
            message: 'Each gemstone must have type, carat > 0, and count > 0' 
          });
        }
      }
    }

    // Validate variants array
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        // Generate variant_id if not provided
        if (!variant.variant_id) {
          variant.variant_id = 'var_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }

        if (!variant.name || !variant.making_price || variant.making_price <= 0) {
          return res.status(400).json({ 
            message: 'Each variant must have name and making_price > 0' 
          });
        }
        if (!Number.isFinite(variant.stock_quantity) || variant.stock_quantity < 0) {
          return res.status(400).json({ 
            message: 'Each variant stock_quantity must be a non-negative number' 
          });
        }
        if (variant.metal && Array.isArray(variant.metal)) {
          for (const metal of variant.metal) {
            if (!metal.type || !metal.purity || !metal.weight || metal.weight <= 0) {
              return res.status(400).json({ 
                message: 'Each variant metal must have type, purity, and weight > 0' 
              });
            }
          }
        }
      }
    }

    // Calculate prices using computeProductPrice for consistency
    let baseTotalPrice = 0;
    let baseMaterialCostVal = null;
    try {
      // Build a temporary product object for price calculation
      const tempProduct = {
        name,
        makingPrice,
        category_id,
        description,
        is_active,
        variants,
        metals,
        gemstones,
        stock_quantity
      };
      const priceResult = await computeProductPrice(tempProduct);
      if (priceResult.success && Array.isArray(priceResult.data)) {
        // If there are variants, calculate prices for each variant
        if (variants && variants.length > 0) {
          for (const variant of variants) {
            const variantPricing = priceResult.data.find(item => item.variant_id === variant.variant_id);
            if (variantPricing) {
              variant.totalPrice = Math.round(variantPricing.subtotal || 0);
              const mCost = (variantPricing.metals || []).reduce((sum, m) => sum + (m.totalPrice || 0), 0);
              const gCost = (variantPricing.gemstones || []).reduce((sum, g) => sum + (g.totalPrice || 0), 0);
              variant.baseMaterialCost = Math.round(mCost + gCost);
            } else {
              variant.totalPrice = 0;
              variant.baseMaterialCost = null;
            }
          }
        } else {
          // For base products (no variants), set the base totalPrice
          if (priceResult.data.length > 0) {
            const bp = priceResult.data[0];
            baseTotalPrice = Math.round(bp.subtotal || 0);
            const mCost = (bp.metals || []).reduce((sum, m) => sum + (m.totalPrice || 0), 0);
            const gCost = (bp.gemstones || []).reduce((sum, g) => sum + (g.totalPrice || 0), 0);
            baseMaterialCostVal = Math.round(mCost + gCost);
            console.log('✅ Base product price calculated:', baseTotalPrice);
          }
        }
      } else {
        if (variants && variants.length > 0) {
          for (const variant of variants) {
            variant.totalPrice = 0;
            variant.baseMaterialCost = null;
          }
        }
      }
    } catch (error) {
      console.error('Error calculating prices:', error);
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          variant.totalPrice = 0;
          variant.baseMaterialCost = null;
        }
      }
    }

    // Let the Product schema generate its own string ID
    const product = new Product({
      name,
      makingPrice,
      category_id,
      description,
      is_active,
      variants,
      metals,
      gemstones,
      stock_quantity,
      totalPrice: baseTotalPrice, // Add calculated base price
      baseMaterialCost: baseMaterialCostVal,
      reconstruction_job_id,
      reconstruction_status
    });

    await product.save();

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('❌ Create product error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body:', req.body);
    return res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload multiple images for a product (admin only)
 * @access  Private (Admin)
 */
router.post('/:id/images', authenticateToken, isAdmin, uploadImage.array('images', 10), async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image file is required' });
    }

    // Add images to product's images array
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const imageObject = {
        image_url: file.path, // Cloudinary URL
        alt_text: `${product.name} image ${product.images.length + i + 1}`,
        is_primary: product.images.length === 0 && i === 0, // First image of first upload is primary
        sort_order: product.images.length + i
      };
      
      product.images.push(imageObject);
    }

    // Save the updated product
    await product.save();

    res.status(201).json({
      message: 'Product images uploaded successfully',
      images: product.images
    });

  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/products/:id/model
 * @desc    Upload 3D model for a product (admin only)
 * @access  Private (Admin)
 */
router.post('/:id/model', authenticateToken, isAdmin, (req, res, next) => {
  uploadModel.single('model')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'File too large. Maximum size is 10MB due to Cloudinary free plan limits. Please compress your 3D model or upgrade the Cloudinary plan.' 
          });
        }
        return res.status(400).json({ message: err.message });
      }
      // Handle Cloudinary-specific errors
      if (err.message && err.message.includes('File size too large')) {
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 10MB due to Cloudinary free plan limits. Please compress your 3D model or consider upgrading the Cloudinary plan.' 
        });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('3D Model upload request received for product:', req.params.id);
    console.log('File details:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file received');

    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.file) {
      console.log('No 3D model file received');
      return res.status(400).json({ message: '3D model file is required' });
    }

    console.log('Cloudinary file path:', req.file.path);

    // Update product with 3D model URL
    product.model_3d_url = req.file.path; // Cloudinary URL
    await product.save();

    console.log('3D model uploaded successfully for product:', productId);

    res.status(201).json({
      message: '3D model uploaded successfully',
      model_url: req.file.path,
      product
    });

  } catch (error) {
    console.error('Upload 3D model error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/products/:id/certificates
 * @desc    Upload certificates for a product (admin only)
 * @access  Private (Admin)
 */
router.post('/:id/certificates', authenticateToken, isAdmin, uploadCertificate.array('certificates', 10), async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one certificate file is required' });
    }

    // Extract certificate names from request body
    const certificateNames = [];
    for (let i = 0; i < req.files.length; i++) {
      const nameKey = `certificates[${i}][name]`;
      if (req.body[nameKey]) {
        certificateNames.push(req.body[nameKey]);
      } else {
        certificateNames.push(`Certificate ${i + 1}`);
      }
    }

    // Add certificate objects to product's certificates array
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const certificateName = certificateNames[i];
      
      const certificateObject = {
        name: certificateName,
        file_url: file.path
      };
      
      product.certificates.push(certificateObject);
    }

    // Save the updated product with new certificate data
    await product.save();

    res.status(201).json({
      message: 'Product certificates uploaded successfully',
      certificates: product.certificates
    });

  } catch (error) {
    console.error('Upload certificates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/products/:id/toggle-active
 * @desc    Toggle product active status (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/toggle-active', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Toggle the is_active field
    product.is_active = !product.is_active;
    await product.save();

    res.json({ 
      message: `Product ${product.is_active ? 'activated' : 'deactivated'} successfully`,
      product: {
        id: product.id,
        name: product.name,
        is_active: product.is_active
      }
    });

  } catch (error) {
    console.error('Error toggling product active status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product (admin only)
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    console.log('🔄 Updating product:', productId);
    console.log('📝 Update data:', updateData);

    // Find the existing product using custom id field
    const existingProduct = await Product.findOne({ id: productId });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If variants are being updated, calculate totalPrice for each variant
    if (updateData.variants && Array.isArray(updateData.variants)) {
      for (const variant of updateData.variants) {
        // Generate variant_id if not provided
        if (!variant.variant_id) {
          variant.variant_id = 'var_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }

        // Validate variant structure
        if (!variant.name || !variant.making_price || variant.making_price <= 0) {
          return res.status(400).json({ 
            message: 'Each variant must have name and making_price > 0' 
          });
        }
        if (!Number.isFinite(variant.stock_quantity) || variant.stock_quantity < 0) {
          return res.status(400).json({ 
            message: 'Each variant stock_quantity must be a non-negative number' 
          });
        }
        if (variant.metal && Array.isArray(variant.metal)) {
          for (const metal of variant.metal) {
            if (!metal.type || !metal.purity || !metal.weight || metal.weight <= 0) {
              return res.status(400).json({ 
                message: 'Each variant metal must have type, purity, and weight > 0' 
              });
            }
          }
        }
      }

      // After validation, calculate all variant prices at once using computeProductPrice
      try {
        // Build a temporary product object for price calculation
        const tempProduct = {
          ...existingProduct.toObject(),
          ...updateData,
        };
        const priceResult = await computeProductPrice(tempProduct);
        if (priceResult.success && Array.isArray(priceResult.data)) {
          for (const variant of updateData.variants) {
            const variantPricing = priceResult.data.find(item => item.variant_id === variant.variant_id);
            if (variantPricing) {
              variant.totalPrice = Math.round(variantPricing.subtotal || 0);
              const mCost = (variantPricing.metals || []).reduce((sum, m) => sum + (m.totalPrice || 0), 0);
              const gCost = (variantPricing.gemstones || []).reduce((sum, g) => sum + (g.totalPrice || 0), 0);
              variant.baseMaterialCost = Math.round(mCost + gCost);
            } else {
              variant.totalPrice = 0;
              variant.baseMaterialCost = null;
            }
          }
        } else {
          for (const variant of updateData.variants) {
            variant.totalPrice = 0;
            variant.baseMaterialCost = null;
          }
        }
      } catch (error) {
        console.error('Error calculating variant price:', error);
        for (const variant of updateData.variants) {
          variant.totalPrice = 0;
          variant.baseMaterialCost = null;
        }
      }
    } else {
      // For base products (no variants), calculate totalPrice
      if (updateData.metals || updateData.makingPrice || updateData.gemstones) {
        try {
          // Build a temporary product object for price calculation
          const tempProduct = {
            ...existingProduct.toObject(),
            ...updateData,
          };
          const priceResult = await computeProductPrice(tempProduct);
          if (priceResult.success && priceResult.data && priceResult.data.length > 0) {
            const bp = priceResult.data[0];
            updateData.totalPrice = Math.round(bp.subtotal || 0);
            const mCost = (bp.metals || []).reduce((sum, m) => sum + (m.totalPrice || 0), 0);
            const gCost = (bp.gemstones || []).reduce((sum, g) => sum + (g.totalPrice || 0), 0);
            updateData.baseMaterialCost = Math.round(mCost + gCost);
            console.log('✅ Base product price recalculated:', updateData.totalPrice);
          } else {
            console.log('⚠️ Price calculation returned no data, keeping existing price');
          }
        } catch (error) {
          console.error('Error calculating base product price:', error);
          // Keep existing price on error
        }
      }
    }

    // Update the product with new data using custom id field
    const updatedProduct = await Product.findOneAndUpdate(
      { id: productId },
      updateData,
      { 
        new: true,  // Return the updated document
        runValidators: true  // Run schema validations
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found for update' });
    }

    console.log('✅ Product updated successfully:', updatedProduct.name);

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    res.status(500).json({ 
      message: 'Server error while updating product',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already deleted
    if (product.is_deleted) {
      return res.status(400).json({ message: 'Product is already deleted' });
    }

    // Soft delete: Mark as deleted instead of removing from database
    product.is_deleted = true;
    product.deleted_at = new Date();
    product.deleted_by = req.user.id; // Track who deleted it
    product.is_active = false; // Also mark as inactive
    await product.save();

    res.json({
      message: 'Product deleted successfully',
      deletedProductId: productId
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
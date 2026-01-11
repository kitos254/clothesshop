import Product from '../model/Product.js';
import Category from '../model/categories.js';
import cloudinaryService from '../services/cloudinaryService.js';
import mongoose from 'mongoose';

// Helper function to process variations and maintain ID relationships
const processVariationData = (variationDefinitions = [], variationCombinations = [], existingProduct = null) => {
  // Create a mapping from temp IDs to new ObjectIds
  const idMapping = new Map();
  
  // If updating existing product, map existing variation IDs
  if (existingProduct && existingProduct.variationDefinitions) {
    existingProduct.variationDefinitions.forEach(existingDef => {
      // Try to match by name to preserve existing IDs
      const matchingDef = variationDefinitions.find(def => def.name === existingDef.name);
      if (matchingDef && matchingDef._id && matchingDef._id.toString().startsWith('temp-')) {
        idMapping.set(matchingDef._id, existingDef._id);
      }
    });
  }
  
  // Process variation definitions
  const cleanDefinitions = variationDefinitions.map(definition => {
    const cleanDefinition = { ...definition };
    
    // Handle temporary IDs
    if (cleanDefinition._id && cleanDefinition._id.toString().startsWith('temp-')) {
      if (idMapping.has(cleanDefinition._id)) {
        // Use existing ID if found
        cleanDefinition._id = idMapping.get(cleanDefinition._id);
      } else {
        // Generate new ID for new variations
        const newId = new mongoose.Types.ObjectId();
        idMapping.set(definition._id, newId);
        delete cleanDefinition._id; // Let MongoDB auto-generate
      }
    }
    
    return cleanDefinition;
  });
  
  // Process variation combinations and update variationId references
  const cleanCombinations = variationCombinations.map(combination => {
    const cleanCombination = { ...combination };
    
    // Remove temporary IDs from combinations
    if (cleanCombination._id && cleanCombination._id.toString().startsWith('temp-')) {
      delete cleanCombination._id;
    }
    
    // Update combination references to use mapped IDs
    if (cleanCombination.combination) {
      cleanCombination.combination = cleanCombination.combination.map(ref => {
        let variationId = ref.variationId;
        
        // If it's a temp ID, use the mapped real ID
        if (ref.variationId && ref.variationId.toString().startsWith('temp-')) {
          variationId = idMapping.get(ref.variationId) || new mongoose.Types.ObjectId();
        }
        
        return {
          variationId,
          variationName: ref.variationName,
          value: ref.value
        };
      });
    }
    
    return cleanCombination;
  });
  
  return { cleanDefinitions, cleanCombinations };
};

// Get all products with filtering, sorting, and pagination
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      minPrice,
      maxPrice,
      status,
      isFeatured,
      isActive,
      isNewArrival,
      isOnSale,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      condition,
      includeDrafts = false
    } = req.query;

    // Build filter object
    const filter = {};

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      }
    }

    // Brand filter
    if (brand) {
      filter['brand.name'] = new RegExp(brand, 'i');
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Status filters - handle draft inclusion
    if (status) {
      filter.status = status;
    } else if (!includeDrafts || includeDrafts === 'false') {
      // If not explicitly including drafts, exclude them
      filter.status = { $ne: 'draft' };
    }
    // If includeDrafts is true, don't add status filter (include all statuses)

    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isNewArrival !== undefined) filter.isNewArrival = isNewArrival === 'true';
    if (isOnSale !== undefined) filter.isOnSale = isOnSale === 'true';
    if (condition) filter.condition = condition;

    // Search filter
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'brand.name': new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'name slug path')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product by ID or slug
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Populate related data
    await product.populate([
      { path: 'category', select: 'name slug path' },
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
      { path: 'relatedProducts', select: 'name slug price images brand' },
      { path: 'crossSellProducts', select: 'name slug price images brand' },
      { path: 'upSellProducts', select: 'name slug price images brand' }
    ]);

    // Increment view count if not admin request
    if (!req.headers['x-admin-request']) {
      await product.incrementViews(true);
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Get similar products (public)
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Find the current product to get its category
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).select('category brand');
    } else {
      product = await Product.findOne({ slug: id }).select('category brand');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find similar products in the same category, excluding the current product
    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'active',
      isActive: true
    })
      .select('name slug brand price currentPrice originalPrice images stock variationDefinitions variationCombinations hasVariations')
      .limit(limit)
      .lean();

    // If not enough products in same category, fill with products from same brand
    if (similarProducts.length < limit && product.brand?.name) {
      const additionalProducts = await Product.find({
        _id: { $nin: [product._id, ...similarProducts.map(p => p._id)] },
        'brand.name': product.brand.name,
        status: 'active',
        isActive: true
      })
        .select('name slug brand price currentPrice originalPrice images stock variationDefinitions variationCombinations hasVariations')
        .limit(limit - similarProducts.length)
        .lean();
      
      similarProducts.push(...additionalProducts);
    }

    res.status(200).json({
      success: true,
      data: similarProducts
    });

  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch similar products',
      error: error.message
    });
  }
};

// Get related products (public) - prioritizes products from deepest category level first
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Find the current product to get its category
    let product;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).select('category brand').populate('category');
    } else {
      product = await Product.findOne({ slug: id }).select('category brand').populate('category');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productCategory = product.category;
    if (!productCategory) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    let relatedProducts = [];
    const excludedIds = [product._id];
    const selectFields = 'name slug brand price currentPrice originalPrice images stock variationDefinitions variationCombinations hasVariations category';

    // Strategy: Start from the most specific category (deepest level) and work up
    // Level 2 (grandchild) > Level 1 (child) > Level 0 (parent)
    
    // Step 1: Get products from the SAME category (most specific match)
    if (relatedProducts.length < limit) {
      const sameCategoryProducts = await Product.find({
        _id: { $nin: excludedIds },
        category: productCategory._id,
        status: 'active',
        isActive: true
      })
        .select(selectFields)
        .limit(limit - relatedProducts.length)
        .lean();
      
      relatedProducts.push(...sameCategoryProducts);
      excludedIds.push(...sameCategoryProducts.map(p => p._id));
    }

    // Step 2: Get sibling categories (same parent, same level) - these are closely related
    if (relatedProducts.length < limit && productCategory.parent) {
      const siblingCategories = await Category.find({
        parent: productCategory.parent,
        _id: { $ne: productCategory._id },
        isActive: true
      }).select('_id');

      if (siblingCategories.length > 0) {
        const siblingCategoryIds = siblingCategories.map(c => c._id);
        const siblingProducts = await Product.find({
          _id: { $nin: excludedIds },
          category: { $in: siblingCategoryIds },
          status: 'active',
          isActive: true
        })
          .select(selectFields)
          .limit(limit - relatedProducts.length)
          .lean();
        
        relatedProducts.push(...siblingProducts);
        excludedIds.push(...siblingProducts.map(p => p._id));
      }
    }

    // Step 3: Get products from parent category (one level up)
    if (relatedProducts.length < limit && productCategory.parent) {
      const parentProducts = await Product.find({
        _id: { $nin: excludedIds },
        category: productCategory.parent,
        status: 'active',
        isActive: true
      })
        .select(selectFields)
        .limit(limit - relatedProducts.length)
        .lean();
      
      relatedProducts.push(...parentProducts);
      excludedIds.push(...parentProducts.map(p => p._id));
    }

    // Step 4: Get products from grandparent and its descendants (if still need more)
    if (relatedProducts.length < limit && productCategory.parent) {
      const parentCategory = await Category.findById(productCategory.parent).select('parent');
      
      if (parentCategory?.parent) {
        // Get all categories under grandparent
        const grandparentDescendants = await Category.find({
          $or: [
            { _id: parentCategory.parent },
            { parent: parentCategory.parent }
          ],
          _id: { $ne: productCategory._id },
          isActive: true
        }).select('_id');

        if (grandparentDescendants.length > 0) {
          const grandparentCategoryIds = grandparentDescendants.map(c => c._id);
          const grandparentProducts = await Product.find({
            _id: { $nin: excludedIds },
            category: { $in: grandparentCategoryIds },
            status: 'active',
            isActive: true
          })
            .select(selectFields)
            .limit(limit - relatedProducts.length)
            .lean();
          
          relatedProducts.push(...grandparentProducts);
          excludedIds.push(...grandparentProducts.map(p => p._id));
        }
      }
    }

    // Step 5: If still not enough, get products from same brand
    if (relatedProducts.length < limit && product.brand?.name) {
      const brandProducts = await Product.find({
        _id: { $nin: excludedIds },
        'brand.name': product.brand.name,
        status: 'active',
        isActive: true
      })
        .select(selectFields)
        .limit(limit - relatedProducts.length)
        .lean();
      
      relatedProducts.push(...brandProducts);
    }

    res.status(200).json({
      success: true,
      data: relatedProducts
    });

  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch related products',
      error: error.message
    });
  }
};

// Get popular products (public) - sorted by views
export const getPopularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    const popularProducts = await Product.find({
      status: 'active',
      isActive: true
    })
      .select('name slug brand price currentPrice originalPrice images stock variationDefinitions variationCombinations hasVariations views reviews category')
      .sort({ 'views.total': -1, 'views.unique': -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: popularProducts
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular products',
      error: error.message
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    // Parse JSON fields if they come from FormData
    let productData = { ...req.body };
    
    // Parse JSON strings back to objects if they exist
    ['brand', 'stock', 'shipping', 'seo', 'discount', 'warranty', 'variationDefinitions', 'variationCombinations'].forEach(field => {
      if (typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });
    
    // Check if this is a draft product
    const isDraft = productData.status === 'draft' || productData.isDraft === true;
    
    if (!isDraft) {
      // Validate required fields for live products
      const { name, category, brand, originalPrice, currentPrice, price, sku } = productData;
      
      // Check if we have at least one price field
      const hasValidPrice = originalPrice || currentPrice || price;
      
      if (!name || !category || !brand || !hasValidPrice || !sku) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, category, brand, price (originalPrice, currentPrice, or price), sku'
        });
      }

      // Verify category exists for live products (only if category is not empty)
      if (category && category.trim() !== '') {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID'
          });
        }
        
        // Products can only be assigned to grandchild categories (level 2)
        if (categoryExists.level !== 2) {
          return res.status(400).json({
            success: false,
            message: 'Products can only be placed in grandchild categories (Level 3). Please select a category at the lowest level of the hierarchy.'
          });
        }
      }

      // Check if SKU already exists for live products
      const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Process uploaded images
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await cloudinaryService.uploadMultipleImages(
          req.files.map(file => file.buffer),
          {
            folder: `products/${productData.category || 'uncategorized'}`,
            adminId
          }
        );

        // Process successful uploads
        uploadedImages = uploadResults
          .filter(result => result.success)
          .map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            alt: `${productData.name || 'Product'} image ${index + 1}`,
            isPrimary: index === 0, // First image is primary
            displayOrder: index,
            cloudinaryAccount: result.cloudinaryAccount,
            size: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
            uploadedAt: result.uploadedAt,
            uploadedBy: adminId
          }));

        // Log failed uploads
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.error('Some images failed to upload:', failedUploads);
        }

      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images',
          error: uploadError.message
        });
      }
    }

    // Process variations if provided
    let processedVariations = false;
    if (productData.hasVariations && productData.variationDefinitions && productData.variationDefinitions.length > 0) {
      // Validate variation definitions
      if (productData.variationDefinitions.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5 variations are allowed per product'
        });
      }

      // If no combinations provided, auto-generate them
      if (!productData.variationCombinations || productData.variationCombinations.length === 0) {
        const tempProduct = new Product({ variationDefinitions: productData.variationDefinitions });
        const generatedCombinations = tempProduct.generateVariationCombinations();
        
        productData.variationCombinations = generatedCombinations.map((combination, index) => ({
          combination,
          sku: `${productData.sku || 'PRD'}-${combination.map(c => c.value.substring(0, 2).toUpperCase()).join('-')}`,
          price: productData.currentPrice || productData.price || 0,
          comparePrice: productData.originalPrice || productData.comparePrice || 0,
          costPrice: productData.costPrice || 0,
          stock: { quantity: 0, reserved: 0 },
          isActive: true,
          isDefault: index === 0
        }));
      }
      
      processedVariations = true;
    }

    // Create final product data
    const finalProductData = {
      ...productData,
      images: uploadedImages,
      createdBy: adminId,
      hasVariants: productData.variants && productData.variants.length > 0,
      hasVariations: processedVariations
    };

    // Ensure backward compatibility for price field and set proper defaults
    if (finalProductData.currentPrice && !finalProductData.price) {
      finalProductData.price = finalProductData.currentPrice;
    }
    if (finalProductData.price && !finalProductData.currentPrice) {
      finalProductData.currentPrice = finalProductData.price;
    }
    if (finalProductData.price && !finalProductData.originalPrice) {
      finalProductData.originalPrice = finalProductData.price;
    }

    // Remove empty category to prevent ObjectId cast error
    if (finalProductData.category === '' || finalProductData.category === null) {
      delete finalProductData.category;
    }

    // Process variations to handle temporary IDs
    if (finalProductData.variationDefinitions || finalProductData.variationCombinations) {
      const { cleanDefinitions, cleanCombinations } = processVariationData(
        finalProductData.variationDefinitions,
        finalProductData.variationCombinations
      );
      finalProductData.variationDefinitions = cleanDefinitions;
      finalProductData.variationCombinations = cleanCombinations;
    }

    // Create product
    const product = new Product(finalProductData);
    await product.save();

    // Update category product counts if a category is assigned
    if (product.category) {
      try {
        const category = await Category.findById(product.category);
        if (category) {
          await category.updateProductCounts();
        }
      } catch (statsError) {
        console.error('Error updating category stats:', statsError);
        // Don't fail the product creation if stats update fails
      }
    }

    // Populate for response
    await product.populate([
      { path: 'category', select: 'name slug path' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Create draft product with auto-generated fields
export const createDraftProduct = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    // Auto-generate basic draft data
    const draftCount = await Product.countDocuments({ status: 'draft' });
    const draftNumber = String(draftCount + 1).padStart(3, '0');
    const timestamp = Date.now();
    
    const draftData = {
      name: `Product ${draftNumber}`,
      description: '',
      sku: `PRD-${draftNumber}-${timestamp}`,
      slug: `product-${draftNumber}-${timestamp}`,
      model: '',
      brand: { 
        name: 'Unspecified Brand',
        logo: '',
        website: ''
      },
      price: 0,
      comparePrice: 0,
      costPrice: 0,
      currency: 'USD',
      images: [],
      variants: [],
      hasVariants: false,
      stock: {
        quantity: 0,
        minQuantity: 1,
        maxQuantity: 999999,
        trackQuantity: true,
        allowBackorder: false
      },
      shipping: {
        weight: 0,
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'cm'
        },
        freeShipping: false,
        shippingClass: 'standard'
      },
      status: 'draft',
      condition: 'new',
      isFeatured: false,
      isActive: false,
      isNewArrival: false,
      isOnSale: false,
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: ''
      },
      discount: {
        type: 'percentage',
        value: 0,
        isActive: false
      },
      specifications: '',
      keyFeatures: '',
      whatsInBox: '',
      warranty: {
        type: 'none',
        duration: 0,
        description: '',
        terms: ''
      },
      createdBy: adminId
    };

    // Create the draft product
    const product = new Product(draftData);
    await product.save();

    // Populate for response
    await product.populate([
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Draft product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create draft product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create draft product',
      error: error.message
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify category if provided
    if (req.body.category && req.body.category.trim() !== '') {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
      
      // Products can only be assigned to grandchild categories (level 2)
      if (categoryExists.level !== 2) {
        return res.status(400).json({
          success: false,
          message: 'Products can only be placed in grandchild categories (Level 3). Please select a category at the lowest level of the hierarchy.'
        });
      }
    }

    // Check SKU uniqueness if changed
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingSku = await Product.findOne({ 
        sku: req.body.sku.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Handle new image uploads
    let newImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadResults = await cloudinaryService.uploadMultipleImages(
          req.files.map(file => file.buffer),
          {
            folder: `products/${req.body.category || product.category}`,
            adminId
          }
        );

        newImages = uploadResults
          .filter(result => result.success)
          .map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            alt: `${req.body.name || product.name} image ${product.images.length + index + 1}`,
            isPrimary: product.images.length === 0 && index === 0,
            displayOrder: product.images.length + index,
            cloudinaryAccount: result.cloudinaryAccount,
            size: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height,
            uploadedAt: result.uploadedAt,
            uploadedBy: adminId
          }));

      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload new images',
          error: uploadError.message
        });
      }
    }

    // Update product data
    const updateData = {
      ...req.body,
      updatedBy: adminId,
      hasVariants: req.body.variants ? req.body.variants.length > 0 : product.hasVariants
    };

    // Remove empty category to prevent ObjectId cast error
    if (updateData.category === '' || updateData.category === null) {
      delete updateData.category;
    }

    // Don't allow images to be updated directly from request body
    // Images should only be added via file upload or removed via separate endpoint
    // This prevents overwriting images with incomplete data
    delete updateData.images;

    // Process variations to handle temporary IDs
    if (updateData.variationDefinitions || updateData.variationCombinations) {
      const { cleanDefinitions, cleanCombinations } = processVariationData(
        updateData.variationDefinitions,
        updateData.variationCombinations,
        product // Pass existing product to preserve IDs
      );
      updateData.variationDefinitions = cleanDefinitions;
      updateData.variationCombinations = cleanCombinations;
    }

    // Add new images to existing ones
    if (newImages.length > 0) {
      updateData.images = [...product.images, ...newImages];
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update category product counts if category changed
    const oldCategory = product.category;
    const newCategory = updatedProduct.category;
    
    // Update stats for both old and new categories if they differ
    if (oldCategory || newCategory) {
      try {
        const categoriesToUpdate = new Set();
        if (oldCategory) categoriesToUpdate.add(oldCategory.toString());
        if (newCategory) categoriesToUpdate.add(newCategory.toString());
        
        for (const catId of categoriesToUpdate) {
          const cat = await Category.findById(catId);
          if (cat) {
            await cat.updateProductCounts();
          }
        }
      } catch (statsError) {
        console.error('Error updating category stats:', statsError);
        // Don't fail the product update if stats update fails
      }
    }

    // Populate for response
    await updatedProduct.populate([
      { path: 'category', select: 'name slug path' },
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Add new images to existing product
export const addProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if files are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Upload new images
    let newImages = [];
    try {
      console.log('[addProductImages] Uploading', req.files.length, 'files');
      
      const uploadResults = await cloudinaryService.uploadMultipleImages(
        req.files.map(file => file.buffer),
        {
          folder: `products/${product.category || 'uncategorized'}`,
          adminId
        }
      );

      console.log('[addProductImages] Upload results:', JSON.stringify(uploadResults, null, 2));

      // Process successful uploads - validate required fields
      newImages = uploadResults
        .filter(result => {
          if (!result.success) {
            console.log('[addProductImages] Upload failed:', result.error);
            return false;
          }
          // Validate required fields
          if (!result.secure_url || !result.public_id || !result.cloudinaryAccount) {
            console.log('[addProductImages] Missing required fields in result:', {
              secure_url: result.secure_url,
              public_id: result.public_id,
              cloudinaryAccount: result.cloudinaryAccount
            });
            return false;
          }
          return true;
        })
        .map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          alt: `${product.name} image ${product.images.length + index + 1}`,
          isPrimary: product.images.length === 0 && index === 0, // First image is primary if no existing images
          displayOrder: product.images.length + index,
          cloudinaryAccount: result.cloudinaryAccount,
          size: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          uploadedAt: result.uploadedAt || new Date(),
          uploadedBy: adminId
        }));

      console.log('[addProductImages] Processed', newImages.length, 'valid images');

      // Log failed uploads
      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        console.error('Some images failed to upload:', failedUploads);
      }

    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload images',
        error: uploadError.message
      });
    }

    // Check if we have any valid images to add
    if (newImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All image uploads failed. Please check Cloudinary configuration.'
      });
    }

    // Add new images to product
    product.images.push(...newImages);
    product.updatedBy = adminId;
    await product.save();

    // Populate for response
    await product.populate([
      { path: 'category', select: 'name slug path' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: `${newImages.length} images added successfully`,
      data: {
        product,
        newImages: newImages.length,
        failedUploads: req.files.length - newImages.length
      }
    });

  } catch (error) {
    console.error('Add product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add images',
      error: error.message
    });
  }
};

// Delete/Remove images from product
export const removeProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIds } = req.body; // Array of image IDs to remove

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Image IDs array is required'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find images to remove
    const imagesToRemove = product.images.filter(img => 
      imageIds.includes(img._id.toString())
    );

    if (imagesToRemove.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matching images found'
      });
    }

    // Delete images from Cloudinary
    try {
      const deleteResults = await cloudinaryService.deleteMultipleImages(imagesToRemove);
      const failedDeletes = deleteResults.filter(result => !result.success);
      
      if (failedDeletes.length > 0) {
        console.error('Some images failed to delete from Cloudinary:', failedDeletes);
      }
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove images from product
    product.images = product.images.filter(img => 
      !imageIds.includes(img._id.toString())
    );

    // Ensure we have a primary image
    if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    product.updatedBy = req.admin._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Images removed successfully',
      data: product
    });

  } catch (error) {
    console.error('Remove product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove images',
      error: error.message
    });
  }
};

// Suspend/Activate product
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'suspend', 'activate', 'discontinue'

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    switch (action) {
      case 'suspend':
        product.isActive = false;
        product.status = 'inactive';
        break;
      
      case 'activate':
        product.isActive = true;
        product.status = 'active';
        break;
      
      case 'discontinue':
        product.isActive = false;
        product.status = 'discontinued';
        product.discontinuedAt = new Date();
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: suspend, activate, or discontinue'
        });
    }

    product.updatedBy = req.admin._id;
    await product.save();

    await product.populate([
      { path: 'category', select: 'name slug path' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: `Product ${action}d successfully`,
      data: product
    });

  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status',
      error: error.message
    });
  }
};

// Delete product permanently
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        await cloudinaryService.deleteMultipleImages(product.images);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Bulk operations
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Add updatedBy to updates
    updates.updatedBy = req.admin._id;
    updates.updatedAt = new Date();

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Bulk update products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update products',
      error: error.message
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      topBrands,
      categoriesStats
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ 'stock.quantity': 0, 'stock.trackQuantity': true }),
      Product.countDocuments({ 
        $expr: { 
          $and: [
            { $eq: ['$stock.trackQuantity', true] },
            { $lte: ['$stock.quantity', '$stock.minQuantity'] },
            { $gt: ['$stock.quantity', 0] }
          ]
        }
      }),
      Product.aggregate([
        { $group: { _id: '$brand.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $group: {
            _id: '$category',
            name: { $first: '$categoryInfo.name' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          total: totalProducts,
          active: activeProducts,
          featured: featuredProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts
        },
        topBrands,
        topCategories: categoriesStats
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product statistics',
      error: error.message
    });
  }
};

// Variation Management Endpoints

// Add variation definition to product
export const addProductVariation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, affectsPrice = false, affectsStock = true, values = [] } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check variation limit
    if (product.variationDefinitions.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 variations are allowed per product'
      });
    }

    // Check if variation already exists
    const existingVariation = product.variationDefinitions.find(v => v.name.toLowerCase() === name.toLowerCase());
    if (existingVariation) {
      return res.status(400).json({
        success: false,
        message: 'Variation with this name already exists'
      });
    }

    // Add variation definition
    const variationData = {
      name,
      affectsPrice,
      affectsStock,
      values: values.map((value, index) => ({
        value: typeof value === 'string' ? value : value.value,
        displayName: value.displayName || value.value || value,
        colorCode: value.colorCode,
        image: value.image,
        isActive: value.isActive !== undefined ? value.isActive : true,
        displayOrder: value.displayOrder || index
      })),
      displayOrder: product.variationDefinitions.length,
      isActive: true
    };

    product.addVariationDefinition(variationData);
    
    // If this is the first variation, regenerate combinations
    if (product.variationDefinitions.length === 1) {
      const combinations = product.generateVariationCombinations();
      product.updateVariationCombinations(combinations.map((combination, index) => ({
        combination,
        price: product.price,
        comparePrice: product.comparePrice,
        costPrice: product.costPrice,
        stock: { quantity: 0, reserved: 0 },
        isActive: true,
        isDefault: index === 0
      })));
    }

    product.updatedBy = req.admin._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variation added successfully',
      data: product
    });

  } catch (error) {
    console.error('Add product variation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add variation',
      error: error.message
    });
  }
};

// Update variation definition
export const updateProductVariation = async (req, res) => {
  try {
    const { id, variationId } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variation = product.variationDefinitions.id(variationId);
    if (!variation) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    // Check for duplicate variation names if name is being updated
    if (updates.name && updates.name !== variation.name) {
      const existingVariation = product.variationDefinitions.find(v => 
        v._id.toString() !== variationId && 
        v.name.toLowerCase() === updates.name.toLowerCase()
      );
      
      if (existingVariation) {
        return res.status(400).json({
          success: false,
          message: 'Variation with this name already exists'
        });
      }
    }

    // Store old name for combination updates
    const oldName = variation.name;
    const nameChanged = updates.name && updates.name !== oldName;

    // Update variation properties
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && variation[key] !== undefined) {
        variation[key] = updates[key];
      }
    });

    // If name changed, update all combination references
    if (nameChanged) {
      product.variationCombinations.forEach(combo => {
        combo.combination.forEach(comboPart => {
          if (comboPart.variationName === oldName) {
            comboPart.variationName = updates.name;
          }
        });
      });
      product.markModified('variationCombinations');
    }

    // If affectsPrice or affectsStock changed, we might need to regenerate combinations
    // or at least notify that pricing should be reviewed
    const priceStockSettingsChanged = 
      (updates.affectsPrice !== undefined && updates.affectsPrice !== variation.affectsPrice) ||
      (updates.affectsStock !== undefined && updates.affectsStock !== variation.affectsStock);

    product.updatedBy = req.admin._id;
    product.markModified('variationDefinitions');
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variation updated successfully',
      data: product,
      meta: {
        nameChanged,
        priceStockSettingsChanged,
        suggestion: priceStockSettingsChanged ? 
          'Consider reviewing combination pricing due to price/stock setting changes' : null
      }
    });

  } catch (error) {
    console.error('Update product variation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update variation',
      error: error.message
    });
  }
};

// Remove variation definition
export const removeProductVariation = async (req, res) => {
  try {
    const { id, variationId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variationIndex = product.variationDefinitions.findIndex(v => v._id.toString() === variationId);
    if (variationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Variation not found'
      });
    }

    // Remove variation definition
    product.variationDefinitions.splice(variationIndex, 1);

    // Clear combinations if no variations left
    if (product.variationDefinitions.length === 0) {
      product.hasVariations = false;
      product.variationCombinations = [];
    } else {
      // Regenerate combinations without the removed variation
      const combinations = product.generateVariationCombinations();
      product.updateVariationCombinations(combinations.map((combination, index) => ({
        combination,
        price: product.price,
        comparePrice: product.comparePrice,
        costPrice: product.costPrice,
        stock: { quantity: 0, reserved: 0 },
        isActive: true,
        isDefault: index === 0
      })));
    }

    product.updatedBy = req.admin._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variation removed successfully',
      data: product
    });

  } catch (error) {
    console.error('Remove product variation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove variation',
      error: error.message
    });
  }
};

// Update variation combination pricing
export const updateVariationCombinationPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { combinations } = req.body; // Array of combination updates

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!Array.isArray(combinations)) {
      return res.status(400).json({
        success: false,
        message: 'Combinations must be an array'
      });
    }

    // Update each combination
    combinations.forEach(update => {
      const combination = product.variationCombinations.id(update.combinationId);
      if (combination) {
        if (update.price !== undefined) combination.price = update.price;
        if (update.comparePrice !== undefined) combination.comparePrice = update.comparePrice;
        if (update.costPrice !== undefined) combination.costPrice = update.costPrice;
        if (update.stock !== undefined) {
          combination.stock = { ...combination.stock, ...update.stock };
        }
        if (update.isActive !== undefined) combination.isActive = update.isActive;
        if (update.isDefault !== undefined) {
          // Ensure only one default
          if (update.isDefault) {
            product.variationCombinations.forEach(combo => {
              if (combo._id.toString() !== combination._id.toString()) {
                combo.isDefault = false;
              }
            });
          }
          combination.isDefault = update.isDefault;
        }
      }
    });

    product.updatedBy = req.admin._id;
    product.markModified('variationCombinations');
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variation combinations updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update variation combination pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update variation combinations',
      error: error.message
    });
  }
};

// Get variation combinations for a product
export const getProductVariationCombinations = async (req, res) => {
  try {
    const { id } = req.params;
    const { activeOnly = false } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let combinations = product.variationCombinations || [];
    
    if (activeOnly === 'true') {
      combinations = combinations.filter(combo => combo.isActive);
    }

    res.status(200).json({
      success: true,
      data: {
        productId: product._id,
        hasVariations: product.hasVariations,
        variationDefinitions: product.variationDefinitions,
        combinations,
        totalCombinations: combinations.length,
        priceRange: product.priceRange
      }
    });

  } catch (error) {
    console.error('Get product variation combinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get variation combinations',
      error: error.message
    });
  }
};

// Regenerate all variation combinations
export const regenerateVariationCombinations = async (req, res) => {
  try {
    const { id } = req.params;
    const { preservePricing = true } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.hasVariations || !product.variationDefinitions || product.variationDefinitions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product has no variations to generate combinations from'
      });
    }

    // Store existing pricing if preserving
    const existingPricing = {};
    if (preservePricing) {
      product.variationCombinations.forEach(combo => {
        const key = combo.combination.map(c => `${c.variationName}:${c.value}`).sort().join('|');
        existingPricing[key] = {
          price: combo.price,
          comparePrice: combo.comparePrice,
          costPrice: combo.costPrice,
          stock: combo.stock,
          isDefault: combo.isDefault
        };
      });
    }

    // Generate new combinations
    const combinations = product.generateVariationCombinations();
    const newCombinations = combinations.map((combination, index) => {
      const key = combination.map(c => `${c.variationName}:${c.value}`).sort().join('|');
      const existing = existingPricing[key];

      return {
        combination,
        price: existing?.price || product.price,
        comparePrice: existing?.comparePrice || product.comparePrice,
        costPrice: existing?.costPrice || product.costPrice,
        stock: existing?.stock || { quantity: 0, reserved: 0 },
        isActive: true,
        isDefault: existing?.isDefault || index === 0
      };
    });

    product.updateVariationCombinations(newCombinations);
    product.updatedBy = req.admin._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Variation combinations regenerated successfully',
      data: {
        product,
        generatedCombinations: newCombinations.length,
        preservedPricing: preservePricing
      }
    });

  } catch (error) {
    console.error('Regenerate variation combinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate variation combinations',
      error: error.message
    });
  }
};
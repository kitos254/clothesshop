import mongoose from 'mongoose';

// Schema for product images
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  publicId: {
    type: String,
    required: true,
    trim: true
  },
  alt: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  // Cloudinary account tracking for load balancing
  cloudinaryAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CloudinaryAccount',
    required: true
  },
  // Image metadata
  size: {
    type: Number,
    min: 0 // Size in bytes
  },
  format: {
    type: String,
    trim: true,
    lowercase: true
  },
  width: {
    type: Number,
    min: 1
  },
  height: {
    type: Number,
    min: 1
  },
  // Upload tracking
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { _id: true });

// Schema for product variation definitions (e.g., Color, Size, Material)
const variationDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  affectsPrice: {
    type: Boolean,
    default: false
  },
  affectsStock: {
    type: Boolean,
    default: true
  },
  values: [{
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    displayName: {
      type: String,
      trim: true
    },
    colorCode: {
      type: String,
      trim: true,
      match: [/^#[0-9A-F]{6}$/i, 'Color code must be a valid hex color']
    },
    image: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Schema for variation combinations with pricing and stock
const variationCombinationSchema = new mongoose.Schema({
  combination: [{
    variationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    variationName: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  }],
  sku: {
    type: String,
    trim: true,
    uppercase: true
  },
  price: {
    type: Number,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  stock: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  images: [imageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Legacy variant schema for backward compatibility
const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true
  },
  price: {
    type: Number,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  image: imageSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Schema for product specifications
const specificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Schema for warranty information
const warrantySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['manufacturer', 'seller', 'extended', 'none'],
    default: 'manufacturer'
  },
  duration: {
    type: Number,
    min: 0 // in months
  },
  description: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schema for shipping information
const shippingSchema = new mongoose.Schema({
  weight: {
    type: Number,
    min: 0 // in kg
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  shippingClass: {
    type: String,
    enum: ['standard', 'heavy', 'fragile', 'electronic', 'liquid', 'hazardous'],
    default: 'standard'
  }
}, { _id: false });

// Schema for SEO data
const seoSchema = new mongoose.Schema({
  metaTitle: {
    type: String,
    trim: true,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  metaKeywords: [{
    type: String,
    trim: true
  }],
  ogTitle: {
    type: String,
    trim: true
  },
  ogDescription: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String,
    trim: true
  }
}, { _id: false });

// Main Product Schema
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    index: 'text'
  },
  slug: {
    type: String,
    required: function() {
      return this.status !== 'draft';
    },
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    index: 'text'
  },
  keyFeatures: {
    type: String,
    trim: true,
    maxlength: [2000, 'Key features cannot exceed 2000 characters']
  },
  whatsInBox: {
    type: String,
    trim: true,
    maxlength: [5000, 'What\'s in the box cannot exceed 5000 characters']
  },
  specifications: {
    type: String,
    trim: true,
    maxlength: [10000, 'Specifications cannot exceed 10000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Product Identification
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9-]+$/, 'SKU can only contain uppercase letters, numbers and hyphens']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  model: {
    type: String,
    trim: true,
    index: true
  },
  
  // Brand Information
  brand: {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true
    },
    logo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Category and Classification
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() {
      return this.status !== 'draft';
    },
    index: true
  },
  
  // Pricing
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    index: true,
    get: function() {
      // For backward compatibility, return currentPrice if price not set
      return this._price || this.currentPrice;
    },
    set: function(value) {
      this._price = value;
      // If setting price and no currentPrice set, use price as currentPrice
      if (value && !this.currentPrice) {
        this.currentPrice = value;
      }
    }
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    default: function() {
      return this.price || this.currentPrice || 0;
    }
  },
  currentPrice: {
    type: Number,
    min: [0, 'Current price cannot be negative'],
    default: function() {
      return this.price || 0;
    }
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  currency: {
    type: String,
    default: 'KSH',
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO code']
  },
  
  // Discount and Promotion
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      min: 0,
      default: 0
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Inventory Management
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
      index: true
    },
    minQuantity: {
      type: Number,
      min: 0,
      default: 1
    },
    maxQuantity: {  
      type: Number,
      min: 1,
      default: 999999
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  
  // Product Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isNewArrival: {
    type: Boolean,
    default: false,
    index: true
  },
  isOnSale: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Media
  images: [imageSchema],
  videos: [{
    url: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    duration: Number, // in seconds
    provider: { type: String, enum: ['youtube', 'vimeo', 'direct'], default: 'direct' }
  }],
  
  // Product Variations System
  hasVariations: {
    type: Boolean,
    default: false
  },
  variationDefinitions: {
    type: [variationDefinitionSchema],
    validate: {
      validator: function(variations) {
        return variations.length <= 5;
      },
      message: 'Maximum 5 variations are allowed per product'
    }
  },
  variationCombinations: [variationCombinationSchema],
  variationPricingMode: {
    type: String,
    enum: ['base', 'combination', 'mixed'],
    default: 'base'
    // 'base' - all combinations use base product price
    // 'combination' - each combination has its own price
    // 'mixed' - some variations affect price, others don't
  },
  
  // Legacy variants for backward compatibility
  variants: [variantSchema],
  
  // Technical Specifications are now stored as HTML string (using TipTap editor)
  // The specifications field is defined earlier in the schema as a String type
  // Legacy structured specifications array is no longer used
  
  // Additional Product Details
  warranty: warrantySchema,
  shipping: shippingSchema,
  
  // Condition and Quality
  condition: {
    type: String,
    enum: ['new', 'refurbished', 'used', 'damaged'],
    default: 'new',
    index: true
  },
  qualityGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C'],
    default: 'A'
  },
  
  // Safety and Compliance
  certifications: [{
    name: { type: String, trim: true },
    number: { type: String, trim: true },
    issuedBy: { type: String, trim: true },
    validUntil: Date,
    document: { type: String, trim: true } // URL to certificate
  }],
  safetyWarnings: [{
    type: String,
    trim: true
  }],
  ageRestriction: {
    minAge: { type: Number, min: 0 },
    reason: { type: String, trim: true }
  },
  
  // Customer Interaction
  reviews: {
    count: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRating: { type: Number, default: 0, min: 0 }
  },
  questions: {
    count: { type: Number, default: 0, min: 0 }
  },
  
  // Analytics and Performance
  views: {
    total: { type: Number, default: 0, min: 0 },
    unique: { type: Number, default: 0, min: 0 },
    lastViewed: Date
  },
  sales: {
    totalQuantity: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    lastSold: Date
  },
  
  // SEO and Marketing
  seo: seoSchema,
  
  // Related Products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  crossSellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  upSellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Admin Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Timestamps
  publishedAt: Date,
  discontinuedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', 'brand.name': 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ 'brand.name': 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isNewArrival: 1, isActive: 1 });
productSchema.index({ isOnSale: 1, isActive: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ 'reviews.averageRating': -1 });
productSchema.index({ 'sales.totalQuantity': -1 });
productSchema.index({ tags: 1 });
productSchema.index({ condition: 1, isActive: 1 });
productSchema.index({ publishedAt: -1 });

// Virtual for total available stock across all variations
productSchema.virtual('totalVariationStock').get(function() {
  if (!this.hasVariations || !this.variationCombinations || this.variationCombinations.length === 0) {
    return this.stock.quantity;
  }
  
  return this.variationCombinations.reduce((total, combination) => {
    return total + (combination.stock.quantity - combination.stock.reserved);
  }, 0);
});

// Virtual for price range when variations affect pricing
productSchema.virtual('priceRange').get(function() {
  if (!this.hasVariations || !this.variationCombinations || this.variationCombinations.length === 0) {
    return { min: this.price, max: this.price };
  }
  
  const prices = this.variationCombinations
    .filter(combo => combo.isActive && combo.price !== undefined)
    .map(combo => combo.price);
    
  if (prices.length === 0) {
    return { min: this.price, max: this.price };
  }
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
});

// Virtual for default variation combination
productSchema.virtual('defaultVariationCombination').get(function() {
  if (!this.hasVariations || !this.variationCombinations || this.variationCombinations.length === 0) {
    return null;
  }
  
  const defaultCombo = this.variationCombinations.find(combo => combo.isDefault && combo.isActive);
  return defaultCombo || this.variationCombinations.find(combo => combo.isActive);
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (!this.discount.isActive || !this.discount.value) return this.price;
  
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) return this.price;
  if (this.discount.endDate && now > this.discount.endDate) return this.price;
  
  if (this.discount.type === 'percentage') {
    return this.price - (this.price * this.discount.value / 100);
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// Virtual for savings amount
productSchema.virtual('savings').get(function() {
  return this.price - this.discountedPrice;
});

// Virtual for savings percentage
productSchema.virtual('savingsPercentage').get(function() {
  if (!this.price) return 0;
  return Math.round((this.savings / this.price) * 100);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.stock.trackQuantity) return 'in_stock';
  if (this.stock.quantity <= 0) return this.stock.allowBackorder ? 'backorder' : 'out_of_stock';
  if (this.stock.quantity <= this.stock.minQuantity) return 'low_stock';
  return 'in_stock';
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.isActive && 
         this.status === 'active' && 
         (this.stockStatus === 'in_stock' || this.stockStatus === 'backorder');
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) return null;
  
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

// Pre-save middleware to handle price field migration
productSchema.pre('save', function(next) {
  // For backward compatibility, ensure originalPrice and currentPrice are set
  if (this.price && (!this.originalPrice || !this.currentPrice)) {
    if (!this.originalPrice) {
      this.originalPrice = this.price;
    }
    if (!this.currentPrice) {
      this.currentPrice = this.price;
    }
  }
  
  // If we have originalPrice/currentPrice but no price, set price to currentPrice
  if (!this.price && this.currentPrice) {
    this.price = this.currentPrice;
  }
  
  next();
});

// Pre-save middleware to generate slug
productSchema.pre('save', async function(next) {
  try {
    // Generate slug if not provided (for all products, including drafts)
    if (!this.slug && this.name) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      // Ensure slug uniqueness
      let counter = 1;
      let originalSlug = this.slug;
      while (await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } })) {
        this.slug = `${originalSlug}-${counter}`;
        counter++;
      }
    }
    
    // If status is changing from draft to active/published, regenerate slug if it looks like a draft slug
    if (this.isModified('status') && this.status !== 'draft' && this.slug && this.slug.match(/^product-\d+-\d+$/)) {
      // This looks like an auto-generated draft slug, regenerate it based on the current name
      if (this.name) {
        this.slug = this.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        
        // Ensure slug uniqueness
        let counter = 1;
        let originalSlug = this.slug;
        while (await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } })) {
          this.slug = `${originalSlug}-${counter}`;
          counter++;
        }
      }
    }
    
    // Auto-generate SKU if not provided
    if (!this.sku && this.name && this.brand.name) {
      const brandCode = this.brand.name.substring(0, 3).toUpperCase();
      const nameCode = this.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      this.sku = `${brandCode}-${nameCode}-${timestamp}`;
    }
    
    // Set published date when activating
    if (this.isModified('isActive') && this.isActive && !this.publishedAt) {
      this.publishedAt = new Date();
    }
    
    // Ensure only one primary image
    if (this.images && this.images.length > 0) {
      let hasPrimary = false;
      this.images.forEach((img, index) => {
        if (img.isPrimary && !hasPrimary) {
          hasPrimary = true;
        } else if (img.isPrimary && hasPrimary) {
          img.isPrimary = false;
        }
      });
      
      // If no primary image, set first one as primary
      if (!hasPrimary) {
        this.images[0].isPrimary = true;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to validate variations
productSchema.pre('save', function(next) {
  if (this.hasVariations && (!this.variationDefinitions || this.variationDefinitions.length === 0)) {
    return next(new Error('Product marked as having variations must have at least one variation definition'));
  }
  
  if (!this.hasVariations && this.variationDefinitions && this.variationDefinitions.length > 0) {
    this.variationDefinitions = [];
    this.variationCombinations = [];
  }
  
  // Validate variation definitions
  if (this.variationDefinitions && this.variationDefinitions.length > 5) {
    return next(new Error('Maximum 5 variations are allowed per product'));
  }
  
  // Ensure default combination exists if there are combinations
  if (this.hasVariations && this.variationCombinations && this.variationCombinations.length > 0) {
    const hasDefault = this.variationCombinations.some(combo => combo.isDefault);
    if (!hasDefault) {
      // Set first active combination as default
      const firstActive = this.variationCombinations.find(combo => combo.isActive);
      if (firstActive) {
        firstActive.isDefault = true;
      }
    }
  }
  
  // Legacy variant validation
  if (this.hasVariants && (!this.variants || this.variants.length === 0)) {
    return next(new Error('Product marked as having variants must have at least one variant'));
  }
  
  if (!this.hasVariants && this.variants && this.variants.length > 0) {
    this.variants = [];
  }
  
  next();
});

// Static methods
productSchema.statics.findByCategory = function(categoryId, options = {}) {
  const query = { category: categoryId, isActive: true };
  return this.find(query, null, options);
};

productSchema.statics.findByBrand = function(brandName, options = {}) {
  const query = { 'brand.name': new RegExp(brandName, 'i'), isActive: true };
  return this.find(query, null, options);
};

productSchema.statics.findInPriceRange = function(minPrice, maxPrice, options = {}) {
  const query = { 
    price: { $gte: minPrice, $lte: maxPrice }, 
    isActive: true 
  };
  return this.find(query, null, options);
};

productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .limit(limit)
    .sort({ 'reviews.averageRating': -1, 'sales.totalQuantity': -1 });
};

productSchema.statics.findBestSellers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'sales.totalQuantity': -1 })
    .limit(limit);
};

productSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    'reviews.count': { $gte: 5 } 
  })
    .sort({ 'reviews.averageRating': -1 })
    .limit(limit);
};

// Instance methods for variation management
productSchema.methods.addVariationDefinition = function(variationData) {
  if (this.variationDefinitions.length >= 5) {
    throw new Error('Maximum 5 variations are allowed per product');
  }
  
  this.variationDefinitions.push(variationData);
  this.hasVariations = true;
  this.markModified('variationDefinitions');
  return this;
};

productSchema.methods.generateVariationCombinations = function() {
  if (!this.hasVariations || this.variationDefinitions.length === 0) {
    return [];
  }
  
  const variations = this.variationDefinitions.filter(v => v.isActive);
  if (variations.length === 0) return [];
  
  // Generate all possible combinations
  function generateCombinations(variationIndex, currentCombination) {
    if (variationIndex === variations.length) {
      return [currentCombination];
    }
    
    const variation = variations[variationIndex];
    const activeValues = variation.values.filter(v => v.isActive);
    const combinations = [];
    
    for (const value of activeValues) {
      const newCombination = [
        ...currentCombination,
        {
          variationId: variation._id,
          variationName: variation.name,
          value: value.value
        }
      ];
      combinations.push(...generateCombinations(variationIndex + 1, newCombination));
    }
    
    return combinations;
  }
  
  return generateCombinations(0, []);
};

productSchema.methods.updateVariationCombinations = function(combinations) {
  // Clear existing combinations
  this.variationCombinations = [];
  
  // Add new combinations
  combinations.forEach((combination, index) => {
    const sku = this.generateVariationSku(combination.combination);
    this.variationCombinations.push({
      combination: combination.combination,
      sku,
      price: combination.price || this.price,
      comparePrice: combination.comparePrice || this.comparePrice,
      costPrice: combination.costPrice || this.costPrice,
      stock: combination.stock || { quantity: 0, reserved: 0 },
      isActive: combination.isActive !== undefined ? combination.isActive : true,
      isDefault: combination.isDefault || index === 0
    });
  });
  
  this.markModified('variationCombinations');
  return this;
};

productSchema.methods.generateVariationSku = function(combination) {
  if (!combination || combination.length === 0) return this.sku;
  
  const baseSku = this.sku || 'PRD';
  const variationCode = combination.map(c => 
    c.value.substring(0, 2).toUpperCase()
  ).join('-');
  
  return `${baseSku}-${variationCode}`;
};

productSchema.methods.findVariationCombination = function(variationSelections) {
  if (!this.hasVariations || !this.variationCombinations || this.variationCombinations.length === 0) {
    return null;
  }
  
  return this.variationCombinations.find(combo => {
    if (combo.combination.length !== variationSelections.length) return false;
    
    return combo.combination.every(comboVar => {
      const selection = variationSelections.find(sel => 
        sel.variationId.toString() === comboVar.variationId.toString() ||
        sel.variationName === comboVar.variationName
      );
      return selection && selection.value === comboVar.value;
    });
  });
};

productSchema.methods.updateVariationStock = function(combinationId, quantity, operation = 'set') {
  const combination = this.variationCombinations.id(combinationId);
  if (!combination) {
    throw new Error('Variation combination not found');
  }
  
  if (operation === 'add') {
    combination.stock.quantity += quantity;
  } else if (operation === 'subtract') {
    combination.stock.quantity = Math.max(0, combination.stock.quantity - quantity);
  } else {
    combination.stock.quantity = Math.max(0, quantity);
  }
  
  this.markModified('variationCombinations');
  return this.save();
};

// Instance methods
productSchema.methods.updateStock = function(quantity, operation = 'set') {
  if (operation === 'add') {
    this.stock.quantity += quantity;
  } else if (operation === 'subtract') {
    this.stock.quantity = Math.max(0, this.stock.quantity - quantity);
  } else {
    this.stock.quantity = Math.max(0, quantity);
  }
  
  return this.save();
};

productSchema.methods.addReview = function(rating) {
  this.reviews.count += 1;
  this.reviews.totalRating += rating;
  this.reviews.averageRating = this.reviews.totalRating / this.reviews.count;
  
  return this.save();
};

productSchema.methods.incrementViews = function(isUnique = false) {
  this.views.total += 1;
  if (isUnique) this.views.unique += 1;
  this.views.lastViewed = new Date();
  
  return this.save();
};

productSchema.methods.recordSale = function(quantity, revenue) {
  this.sales.totalQuantity += quantity;
  this.sales.totalRevenue += revenue;
  this.sales.lastSold = new Date();
  
  // Update stock
  if (this.stock.trackQuantity) {
    this.stock.quantity = Math.max(0, this.stock.quantity - quantity);
  }
  
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;

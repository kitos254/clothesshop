import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Simple Category Schema - like Windows folders
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens']
  },
  
  // Simple nesting support (max 3 levels)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Category hierarchy path for efficient querying
  path: {
    type: String,
    index: true
  }, // e.g., "electronics/computers/laptops"
  
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 2 // Limit to 3 levels (0, 1, 2)
  },
  
  // Category status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Display settings
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Statistics (will be updated by background jobs)
  stats: {
    productCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalProductCount: { // Including subcategories
      type: Number,
      default: 0,
      min: 0
    },
    activeProductCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Timestamps
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ parent: 1, displayOrder: 1 });
categorySchema.index({ 'stats.productCount': -1 });
categorySchema.index({ createdAt: -1 });

// Virtual for full path array
categorySchema.virtual('pathArray').get(function() {
  return this.path ? this.path.split('/') : [];
});

// Pre-save middleware to generate slug and path
categorySchema.pre('save', async function(next) {
  try {
    // Generate slug from name - always ensure slug exists
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

    // Validate that slug exists (fail if no name provided)
    if (!this.slug) {
      return next(new Error('Category name is required to generate slug'));
    }
    
    // Generate path and level
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.path = parentCategory.path ? `${parentCategory.path}/${this.slug}` : this.slug;
        this.level = parentCategory.level + 1;
        
        // Validate nesting depth (max 3 levels: 0, 1, 2)
        if (this.level > 2) {
          throw new Error('Category nesting depth cannot exceed 3 levels');
        }
      }
    } else {
      this.path = this.slug;
      this.level = 0;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update parent's children array
categorySchema.post('save', async function(doc) {
  try {
    if (doc.parent) {
      await this.constructor.findByIdAndUpdate(
        doc.parent,
        { $addToSet: { children: doc._id } }
      );
    }
  } catch (error) {
    console.error('Error updating parent category:', error);
  }
});

// Pre-remove middleware to handle cascading operations
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Check if category has products
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });
    
    if (productCount > 0) {
      throw new Error('Cannot delete category that contains products. Please move or delete products first.');
    }
    
    // Check if category has children
    if (this.children && this.children.length > 0) {
      throw new Error('Cannot delete category that has subcategories. Please delete subcategories first.');
    }
    
    // Remove from parent's children array
    if (this.parent) {
      await this.constructor.findByIdAndUpdate(
        this.parent,
        { $pull: { children: this._id } }
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
categorySchema.statics.getHierarchy = async function(parentId = null, maxDepth = null) {
  const pipeline = [
    { $match: { parent: parentId, isActive: true } },
    { $sort: { displayOrder: 1, name: 1 } }
  ];
  
  if (maxDepth !== null) {
    pipeline.push({ $match: { level: { $lte: maxDepth } } });
  }
  
  const categories = await this.aggregate(pipeline);
  
  // Recursively fetch children
  for (let category of categories) {
    if (maxDepth === null || category.level < maxDepth) {
      category.children = await this.getHierarchy(category._id, maxDepth);
    }
  }
  
  return categories;
};

categorySchema.statics.getAncestors = async function(categoryId) {
  const category = await this.findById(categoryId);
  if (!category || !category.path) return [];
  
  const slugs = category.path.split('/');
  return await this.find({ slug: { $in: slugs } }).sort({ level: 1 });
};

categorySchema.statics.getDescendants = async function(categoryId) {
  const category = await this.findById(categoryId);
  if (!category) return [];
  
  const pathRegex = new RegExp(`^${category.path}/`);
  return await this.find({
    $or: [
      { _id: categoryId },
      { path: pathRegex }
    ]
  }).sort({ path: 1 });
};

// Instance methods
categorySchema.methods.updateProductCounts = async function() {
  const Product = mongoose.model('Product');
  
  // Direct product count
  this.stats.productCount = await Product.countDocuments({ category: this._id });
  this.stats.activeProductCount = await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  
  // Total product count including subcategories
  const descendants = await this.constructor.getDescendants(this._id);
  const categoryIds = descendants.map(cat => cat._id);
  this.stats.totalProductCount = await Product.countDocuments({ 
    category: { $in: categoryIds } 
  });
  
  await this.save();
};

// Add pagination plugin
categorySchema.plugin(mongoosePaginate);

const Category = mongoose.model('Category', categorySchema);

export default Category;

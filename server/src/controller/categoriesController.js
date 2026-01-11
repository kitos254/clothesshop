import Category from '../model/categories.js';
import { validationResult } from 'express-validator';
import cloudinary from 'cloudinary';
import mongoose from 'mongoose';

// Helper function to handle Cloudinary uploads
const uploadToCloudinary = async (file, folder = 'categories') => {
  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: `newran/${folder}`,
      transformation: [
        { width: 800, height: 600, crop: 'fill', quality: 'auto' },
        { format: 'webp' }
      ]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.v2.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

// Get all categories with hierarchy
export const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      parent,
      level,
      search,
      isActive,
      isFeatured,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (parent !== undefined) {
      filter.parent = parent === 'null' ? null : parent;
    }
    
    if (level !== undefined) {
      filter.level = parseInt(level);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: [
        { path: 'parent', select: 'name slug level path' },
        { path: 'children', select: 'name slug level isActive stats' },
        { path: 'createdBy', select: 'name email' },
        { path: 'updatedBy', select: 'name email' }
      ]
    };

    const result = await Category.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        itemsPerPage: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category hierarchy tree
export const getCategoryTree = async (req, res) => {
  try {
    const { maxDepth = 3, parentId = null } = req.query;
    
    const tree = await Category.getHierarchy(
      parentId === 'null' ? null : parentId,
      parseInt(maxDepth)
    );

    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree',
      error: error.message
    });
  }
};

// Get single category by ID or slug
export const getCategory = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const filter = isObjectId ? { _id: identifier } : { slug: identifier };
    
    const category = await Category.findOne(filter)
      .populate('parent', 'name slug level path')
      .populate('children', 'name slug level isActive stats')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get ancestors for breadcrumb
    const ancestors = await Category.getAncestors(category._id);
    
    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        ancestors
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const categoryData = { ...req.body };
    categoryData.createdBy = req.admin._id;

    // Handle empty parent field - convert empty string to null for root categories
    if (categoryData.parent === '' || categoryData.parent === undefined) {
      categoryData.parent = null;
    }

    // Validate parent category and level constraint
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Enforce 3-level hierarchy (0, 1, 2)
      if (parentCategory.level >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create more than 3 levels of categories'
        });
      }
    }

    const category = new Category(categoryData);
    await category.save();

    // Populate the created category
    await category.populate('parent', 'name slug level path');
    await category.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    updateData.updatedBy = req.admin._id;

    // Find existing category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate parent change and prevent circular references
    if (updateData.parent && updateData.parent !== existingCategory.parent?.toString()) {
      const newParent = await Category.findById(updateData.parent);
      if (!newParent) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Check for circular reference
      const descendants = await Category.getDescendants(id);
      const descendantIds = descendants.map(cat => cat._id.toString());
      if (descendantIds.includes(updateData.parent)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set a descendant category as parent'
        });
      }

      // Enforce 3-level hierarchy
      if (newParent.level >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create more than 3 levels of categories'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('parent', 'name slug level path')
      .populate('children', 'name slug level isActive stats')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete image from Cloudinary
    if (category.image?.publicId) {
      await deleteFromCloudinary(category.image.publicId);
    }

    // The pre-remove middleware will handle validation
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Bulk operations
export const bulkUpdateCategories = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
    }

    const allowedUpdates = ['isActive', 'isFeatured', 'isVisible', 'showInMenu'];
    const updateData = { updatedBy: req.admin._id };
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    const result = await Category.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} categories updated successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk updating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update categories',
      error: error.message
    });
  }
};

// Update display order
export const updateDisplayOrder = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        message: 'Ordered IDs array is required'
      });
    }

    const updatePromises = orderedIds.map((id, index) =>
      Category.findByIdAndUpdate(id, { 
        displayOrder: index,
        updatedBy: req.admin._id
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Display order updated successfully'
    });
  } catch (error) {
    console.error('Error updating display order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update display order',
      error: error.message
    });
  }
};

// Get category statistics
export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          featuredCategories: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
          },
          categoriesByLevel: {
            $push: {
              level: '$level',
              count: 1
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalCategories: 1,
          activeCategories: 1,
          featuredCategories: 1,
          inactiveCategories: { $subtract: ['$totalCategories', '$activeCategories'] }
        }
      }
    ]);

    // Get categories by level
    const levelStats = await Category.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          featuredCategories: 0,
          inactiveCategories: 0
        },
        byLevel: levelStats.map(item => ({
          level: item._id,
          count: item.count,
          name: item._id === 0 ? 'Main Categories' : 
                item._id === 1 ? 'Subcategories' : 'Sub-subcategories'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Update product counts for all categories
export const updateProductCounts = async (req, res) => {
  try {
    const categories = await Category.find({});
    
    const updatePromises = categories.map(category => 
      category.updateProductCounts()
    );
    
    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Product counts updated for all categories'
    });
  } catch (error) {
    console.error('Error updating product counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product counts',
      error: error.message
    });
  }
};

// Get main categories (level 0) - only those with complete hierarchy to level 2
export const getMainCategories = async (req, res) => {
  try {
    // Find main categories that have at least one complete path to level 2
    const mainCategories = await Category.aggregate([
      {
        $match: {
          level: 0,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'subcategories'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subcategories._id',
          foreignField: 'parent',
          as: 'specificCategories'
        }
      },
      {
        $match: {
          'subcategories.0': { $exists: true }, // Has at least one subcategory
          'specificCategories.0': { $exists: true } // Has at least one specific category
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          displayOrder: 1,
          stats: 1
        }
      },
      {
        $sort: { displayOrder: 1, name: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: mainCategories
    });
  } catch (error) {
    console.error('Error fetching main categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch main categories',
      error: error.message
    });
  }
};

// Get subcategories by parent ID (level 1) - only those with children
export const getSubCategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    // Find subcategories that have at least one child category
    const subCategories = await Category.aggregate([
      {
        $match: {
          parent: new mongoose.Types.ObjectId(parentId),
          level: 1,
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'children'
        }
      },
      {
        $match: {
          'children.0': { $exists: true } // Has at least one child
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          displayOrder: 1,
          stats: 1,
          parent: 1
        }
      },
      {
        $sort: { displayOrder: 1, name: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Get child categories by parent ID (level 2)
export const getChildCategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const childCategories = await Category.find({
      parent: new mongoose.Types.ObjectId(parentId),
      level: 2,
      isActive: true
    })
    .select('_id name slug displayOrder stats parent')
    .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: childCategories
    });
  } catch (error) {
    console.error('Error fetching child categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child categories',
      error: error.message
    });
  }
};

// Get category hierarchy (parent chain) for a specific category
export const getCategoryHierarchy = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await Category.findById(new mongoose.Types.ObjectId(categoryId));
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const ancestors = await Category.getAncestors(categoryId);
    
    // Organize the hierarchy
    const hierarchy = {
      mainCategory: ancestors.find(cat => cat.level === 0) || null,
      subCategory: ancestors.find(cat => cat.level === 1) || null,
      specificCategory: ancestors.find(cat => cat.level === 2) || category
    };

    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category hierarchy',
      error: error.message
    });
  }
};

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Customer from '../model/Customer.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create and send token response
const createSendToken = async (customer, statusCode, res, message = 'Success') => {
  const token = generateToken(customer._id);
  const refreshToken = generateRefreshToken();
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  // Set refresh token as httpOnly cookie
  res.cookie('customerRefreshToken', refreshToken, cookieOptions);

  // Save refresh token to customer (hashed)
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  customer.refreshToken = hashedRefreshToken;
  await customer.save({ validateBeforeSave: false });

  // Create response object without password
  const customerResponse = {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    wishlist: customer.wishlist,
    createdAt: customer.createdAt
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      customer: customerResponse
    }
  });
};

// @desc    Register a new customer
// @route   POST /api/customer/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const customer = await Customer.create({
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // Send token response
    await createSendToken(customer, 201, res, 'Account created successfully');

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error creating account. Please try again.'
    });
  }
};

// @desc    Login customer
// @route   POST /api/customer/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Find customer by email (include password for comparison)
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        error: 'No account found with this email. Please sign up first.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again.'
      });
    }

    // Send token response
    await createSendToken(customer, 200, res, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging in. Please try again.'
    });
  }
};

// @desc    Logout customer
// @route   POST /api/customer/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.customer) {
      req.customer.refreshToken = undefined;
      await req.customer.save({ validateBeforeSave: false });
    }

    // Clear the refresh token cookie
    res.cookie('customerRefreshToken', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging out'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/customer/auth/refresh
// @access  Public (requires refresh token cookie)
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.customerRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Find customer with valid refresh token
    const customers = await Customer.find({ refreshToken: { $exists: true } });
    
    let foundCustomer = null;
    for (const customer of customers) {
      const isValid = await bcrypt.compare(refreshToken, customer.refreshToken);
      if (isValid) {
        foundCustomer = customer;
        break;
      }
    }

    if (!foundCustomer) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new access token
    const newToken = generateToken(foundCustomer._id);

    res.status(200).json({
      success: true,
      token: newToken,
      data: {
        customer: {
          id: foundCustomer._id,
          name: foundCustomer.name,
          email: foundCustomer.email,
          wishlist: foundCustomer.wishlist
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Error refreshing token'
    });
  }
};

// @desc    Get current customer profile
// @route   GET /api/customer/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .select('-password -refreshToken')
      .populate('wishlist');

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          wishlist: customer.wishlist,
          createdAt: customer.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (email) {
      // Check if email is already taken
      const existingCustomer = await Customer.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.customer._id }
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
      updateFields.email = email.toLowerCase().trim();
    }

    const customer = await Customer.findByIdAndUpdate(
      req.customer._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          wishlist: customer.wishlist
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/customer/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all password fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Get customer with password
    const customer = await Customer.findById(req.customer._id);
    
    // Check current password
    const isValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error changing password'
    });
  }
};

// @desc    Get customer's shipping addresses
// @route   GET /api/customer/auth/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    
    res.status(200).json({
      success: true,
      data: {
        addresses: customer.shippingAddresses || []
      }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching addresses'
    });
  }
};

// @desc    Add a new shipping address
// @route   POST /api/customer/auth/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { label, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    // Validate required fields
    if (!fullName || !phone || !street || !city || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required address fields'
      });
    }

    const customer = await Customer.findById(req.customer._id);

    // Check if already has 2 addresses
    if (customer.shippingAddresses && customer.shippingAddresses.length >= 2) {
      return res.status(400).json({
        success: false,
        error: 'Maximum of 2 shipping addresses allowed. Please edit or delete an existing address.'
      });
    }

    // If this is set as default or is the first address, update others
    if (isDefault || !customer.shippingAddresses || customer.shippingAddresses.length === 0) {
      if (customer.shippingAddresses) {
        customer.shippingAddresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
    }

    // Add new address
    const newAddress = {
      label: label || 'Home',
      fullName,
      phone,
      street,
      city,
      state: state || '',
      zipCode,
      country: country || 'Kenya',
      isDefault: isDefault || !customer.shippingAddresses || customer.shippingAddresses.length === 0
    };

    if (!customer.shippingAddresses) {
      customer.shippingAddresses = [];
    }
    customer.shippingAddresses.push(newAddress);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        addresses: customer.shippingAddresses
      }
    });

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding address'
    });
  }
};

// @desc    Update a shipping address
// @route   PUT /api/customer/auth/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    const customer = await Customer.findById(req.customer._id);

    const addressIndex = customer.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    // If setting as default, remove default from others
    if (isDefault) {
      customer.shippingAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    const address = customer.shippingAddresses[addressIndex];
    if (label !== undefined) address.label = label;
    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        addresses: customer.shippingAddresses
      }
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating address'
    });
  }
};

// @desc    Delete a shipping address
// @route   DELETE /api/customer/auth/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.customer._id);

    const addressIndex = customer.shippingAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }

    const wasDefault = customer.shippingAddresses[addressIndex].isDefault;
    customer.shippingAddresses.splice(addressIndex, 1);

    // If deleted address was default and there's another address, make it default
    if (wasDefault && customer.shippingAddresses.length > 0) {
      customer.shippingAddresses[0].isDefault = true;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        addresses: customer.shippingAddresses
      }
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting address'
    });
  }
};

// @desc    Sync cart from localStorage to database
// @route   POST /api/customer/auth/sync/cart
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        error: 'Cart items must be an array'
      });
    }

    const customer = await Customer.findById(req.customer._id);

    // Merge localStorage cart with database cart
    // Local items take priority for same product/combination
    const existingCartMap = new Map();
    
    // First, add existing DB cart items to map
    if (customer.cart && customer.cart.length > 0) {
      customer.cart.forEach(item => {
        const key = item.combinationId 
          ? `${item.productId}_${item.combinationId}` 
          : item.productId.toString();
        existingCartMap.set(key, item);
      });
    }

    // Then, merge/override with localStorage items
    cartItems.forEach(item => {
      const key = item.combinationId 
        ? `${item.productId}_${item.combinationId}` 
        : item.productId;
      
      const existingItem = existingCartMap.get(key);
      if (existingItem) {
        // Merge quantities or take the higher one
        existingCartMap.set(key, {
          ...item,
          quantity: Math.max(existingItem.quantity || 0, item.quantity || 1)
        });
      } else {
        existingCartMap.set(key, item);
      }
    });

    // Convert map back to array
    customer.cart = Array.from(existingCartMap.values());
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Cart synced successfully',
      data: {
        cart: customer.cart
      }
    });

  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Error syncing cart'
    });
  }
};

// @desc    Get cart from database
// @route   GET /api/customer/auth/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);

    res.status(200).json({
      success: true,
      data: {
        cart: customer.cart || []
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching cart'
    });
  }
};

// @desc    Update cart in database
// @route   PUT /api/customer/auth/cart
// @access  Private
export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        error: 'Cart items must be an array'
      });
    }

    const customer = await Customer.findById(req.customer._id);
    customer.cart = cartItems;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        cart: customer.cart
      }
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating cart'
    });
  }
};

// @desc    Clear cart in database
// @route   DELETE /api/customer/auth/cart
// @access  Private
export const clearCartDb = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.cart = [];
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: []
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Error clearing cart'
    });
  }
};

// @desc    Sync wishlist from localStorage to database
// @route   POST /api/customer/auth/sync/wishlist
// @access  Private
export const syncWishlist = async (req, res) => {
  try {
    const { wishlistItems } = req.body;

    if (!Array.isArray(wishlistItems)) {
      return res.status(400).json({
        success: false,
        error: 'Wishlist items must be an array'
      });
    }

    const customer = await Customer.findById(req.customer._id);

    // Merge localStorage wishlist with database wishlist
    const existingWishlistMap = new Map();
    
    // First, add existing DB wishlist items to map
    if (customer.wishlist && customer.wishlist.length > 0) {
      customer.wishlist.forEach(item => {
        existingWishlistMap.set(item.productId.toString(), item);
      });
    }

    // Then, merge with localStorage items (don't duplicate)
    wishlistItems.forEach(item => {
      if (!existingWishlistMap.has(item.productId)) {
        existingWishlistMap.set(item.productId, {
          ...item,
          addedAt: new Date()
        });
      }
    });

    // Convert map back to array
    customer.wishlist = Array.from(existingWishlistMap.values());
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist synced successfully',
      data: {
        wishlist: customer.wishlist
      }
    });

  } catch (error) {
    console.error('Sync wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Error syncing wishlist'
    });
  }
};

// @desc    Get wishlist from database
// @route   GET /api/customer/auth/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);

    res.status(200).json({
      success: true,
      data: {
        wishlist: customer.wishlist || []
      }
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching wishlist'
    });
  }
};

// @desc    Update wishlist in database
// @route   PUT /api/customer/auth/wishlist
// @access  Private
export const updateWishlist = async (req, res) => {
  try {
    const { wishlistItems } = req.body;

    if (!Array.isArray(wishlistItems)) {
      return res.status(400).json({
        success: false,
        error: 'Wishlist items must be an array'
      });
    }

    const customer = await Customer.findById(req.customer._id);
    customer.wishlist = wishlistItems;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist updated successfully',
      data: {
        wishlist: customer.wishlist
      }
    });

  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating wishlist'
    });
  }
};

// @desc    Clear wishlist in database
// @route   DELETE /api/customer/auth/wishlist
// @access  Private
export const clearWishlistDb = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    customer.wishlist = [];
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        wishlist: []
      }
    });

  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Error clearing wishlist'
    });
  }
};

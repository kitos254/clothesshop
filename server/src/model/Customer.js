// model/Customer.js
import mongoose from 'mongoose';

const shippingAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // e.g., 'Home', 'Office'
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'Kenya' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  selectedOptions: { type: Map, of: String }, // e.g., { "Color": "Red", "Size": "M" }
  combinationId: { type: String },
  sku: { type: String }
}, { _id: false });

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  originalPrice: { type: Number },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  refreshToken: { type: String, select: false },
  wishlist: [wishlistItemSchema], // Changed from ObjectId refs to full items
  cart: [cartItemSchema], // New cart field
  phone: { type: String },
  shippingAddresses: {
    type: [shippingAddressSchema],
    validate: [arrayLimit, 'Maximum of 2 shipping addresses allowed']
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

// Validator for max 2 addresses
function arrayLimit(val) {
  return val.length <= 2;
}

// Index for faster email lookups
customerSchema.index({ email: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;

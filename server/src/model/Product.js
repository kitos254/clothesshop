import mongoose from "mongoose";

// Details and Care Schema
const detailsAndCareSchema = new mongoose.Schema(
  {
    type: { type: String }, // e.g., 'materials', 'fit', 'care', 'other'
    value: [{ type: String }], // e.g., '65% Recycled Polyester, 30% Organic Cotton, 5% Elastane'
  },
  { _id: false }
);

// Variation Option Schema: lists available choices for each variation type
const variationOptionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'color', 'size', 'material'
    values: [{ type: String, required: true }], // e.g., ['white', 'blue'], ['lg', 'xl']
  },
  { _id: false }
);

// Variation Combination Schema: stores price/stock for combinations determined by priceDeterminedBy
const variationCombinationSchema = new mongoose.Schema(
  {
    options: {
      type: Map,
      of: String, // e.g. { color: 'white', size: 'lg' } or { color: 'blue' }
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { _id: false }
);

// Main Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String },
    brand: { type: String },
    price: { type: Number },
    originalPrice: { type: Number },
    shortDescription: { type: String },
    description: { type: String },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    // List of variation types and their possible values
    variationOptions: [variationOptionSchema],
    // Indicates which variation(s) the price depends on, e.g., ["color"], ["size"], or ["color","size"]
    priceDeterminedBy: [{ type: String, required: true }],
    // All unique combinations (SKUs) of relevant variations, with price and stock
    variationCombinations: [variationCombinationSchema],
    category: [
      {
        type: String,
        enum: ['men', 'women', 'newarrivals', 'collection', 'sale', 'featured'],
      },
    ],
    features: [{ type: String }],
    tags: [{ type: String }],
    badge: { type: String }, // e.g., 'New', 'Sale', 'Limited Edition'
    detailsAndCare: [detailsAndCareSchema],
    inStock: { type: Boolean, default: true },
    deliveryInfo: [
      {
        label: { type: String },
        value: String,
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
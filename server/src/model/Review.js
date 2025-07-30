// model/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: { type: String },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

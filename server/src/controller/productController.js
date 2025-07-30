import Product from '../model/Product.js';
import Review from '../model/Review.js';
import Customer from '../model/Customer.js';

// Fetch products similar to a given product (for 'You might also like')
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    // Find the reference product
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Find products with the same category or overlapping tags, excluding the current product
    const query = {
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } },
      ],
    };
    // Limit to 8 similar products
    const similarProducts = await Product.find(query).limit(8).lean();
    res.status(200).json(similarProducts);
  } catch (error) {
    console.error('Error fetching similar products:', error);
    res.status(500).json({ message: 'Failed to fetch similar products', error: error.message });
  }
};

// Fetch all products with their reviews
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    // Fetch reviews for all products
    const productIds = products.map(p => p._id);
    const reviews = await Review.find({ product: { $in: productIds } }).lean();
    // Attach reviews to each product
    const productsWithReviews = products.map(product => ({
      ...product,
      reviews: reviews.filter(r => r.product.toString() === product._id.toString()),
    }));
    res.status(200).json(productsWithReviews);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

// Fetch a single product with its reviews
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Populate customer name in each review
    const reviews = await Review.find({ product: product._id })
      .populate({ path: 'customer', select: 'name' })
      .lean();
    res.status(200).json({ ...product, reviews });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

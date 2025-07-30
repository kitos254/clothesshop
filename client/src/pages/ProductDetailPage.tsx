import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Share2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Footer from '@/components/Footer';
import ProductShowcase from '@/components/ProductShowcase';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  // Fetch similar products
  useEffect(() => {
    if (!id) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/products/${id}/similar`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch similar products');
        const data = await res.json();
        setSimilarProducts(data);
      })
      .catch(() => setSimilarProducts([]));
  }, [id]);
  // Store selected options for all variations
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For price panel: track quantity for each combination
  const [combinationQtys, setCombinationQtys] = useState<{ [idx: number]: number }>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/products/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Extract images, colors, sizes, features, details, reviews, etc. from product
  let images: string[] = [];
  let features: string[] = [];
  let detailsAndCare: any[] = [];
  let reviews: any[] = [];
  let avgRating: string = '0.0';
  let variationOptions: any[] = [];
  let priceDeterminedBy: string[] = [];
  let variationCombinations: any[] = [];

  if (product) {
    images = Array.isArray(product.images)
      ? product.images.map((img: any) => (typeof img === 'string' ? img : img.url || img))
      : [];
    features = Array.isArray(product.features) ? product.features : [];
    detailsAndCare = Array.isArray(product.detailsAndCare) ? product.detailsAndCare : [];
    reviews = Array.isArray(product.reviews) ? product.reviews : [];
    avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : '0.0';
    variationOptions = Array.isArray(product.variationOptions) ? product.variationOptions : [];
    priceDeterminedBy = Array.isArray(product.priceDeterminedBy) ? product.priceDeterminedBy : [];
    variationCombinations = Array.isArray(product.variationCombinations) ? product.variationCombinations : [];
    // Set default selected options for each variation type if not already set
    variationOptions.forEach((opt) => {
      if (opt.values && opt.values.length > 0 && !selectedOptions[opt.type]) {
        setSelectedOptions((prev) => ({ ...prev, [opt.type]: opt.values[0] }));
      }
    });
  }

  // Find the matching variation combination (if all required options are selected)
  let selectedCombination = null;
  if (
    priceDeterminedBy.length > 0 &&
    priceDeterminedBy.every((key) => selectedOptions[key])
  ) {
    selectedCombination = variationCombinations.find((comb) =>
      priceDeterminedBy.every((key) => comb.options[key] === selectedOptions[key])
    );
  }

  const handleAddToCart = () => {
    // Require all priceDeterminedBy options to be selected
    if (priceDeterminedBy.length > 0 && !priceDeterminedBy.every((key) => selectedOptions[key])) {
      alert('Please select all required options');
      return;
    }
    if (!product) return;
    // TODO: Implement add to cart functionality
    console.log('Added to cart:', {
      product: product.name,
      options: selectedOptions,
      quantity,
    });
  };

  const handleToggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    if (!product) return;
    // TODO: Implement wishlist functionality
    console.log('Toggled wishlist:', product.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          <div className="container mx-auto py-2 px-2 mt-14">
            <div className="flex flex-col md:flex-row gap-10">
              {/* Product Images Skeleton */}
              <div className="md:w-1/2">
                <div className="aspect-square w-full mb-4 bg-gray-200 animate-pulse rounded-lg" />
                <div className="flex gap-3 mt-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="aspect-square w-16 h-16 rounded-md bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
              {/* Product Details Skeleton */}
              <div className="md:w-1/2 flex flex-col">
                <div className="h-8 w-2/3 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-5 w-1/4 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-8 w-1/3 bg-gray-200 rounded mb-6 animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="flex gap-3 mb-4">
                  <div className="h-12 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
              </div>
            </div>
            {/* Tabs Skeleton */}
            <div className="mt-16">
              <div className="h-10 w-full bg-gray-200 rounded mb-6 animate-pulse" />
              <div className="h-32 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Similar Products Skeletons */}
          <section className="py-10 px-2 bg-muted/30 mt-16 rounded-xl">
            <div className="text-center mb-10">
              <div className="h-8 w-1/2 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow flex flex-col overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] w-full bg-gray-200 flex items-center justify-center relative" />
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                    <div className="flex items-center space-x-2 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-3 w-3 bg-gray-200 rounded" />
                      ))}
                      <div className="h-3 w-6 bg-gray-200 rounded" />
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                      <div className="h-3 w-8 bg-gray-200 rounded" />
                    </div>
                    <div className="h-8 w-full bg-gray-200 rounded mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Product not found.
      </div>
    );
  }

  // Helper: check if there are multiple price combinations
  const hasMultiplePrices = variationCombinations && variationCombinations.length > 1;

  // Helper: get a display string for a combination
  const getCombinationLabel = (comb) => {
    if (!comb || !comb.options) return '';
    return Object.entries(comb.options)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  };

  // Helper: set quantity for a combination
  const handleCombinationQtyChange = (idx: number, delta: number) => {
    setCombinationQtys((prev) => ({
      ...prev,
      [idx]: Math.max(1, (prev[idx] ?? 1) + delta),
    }));
  };

  // Helper: get quantity for a combination
  const getCombinationQty = (idx: number) => {
    return combinationQtys[idx] ?? 1;
  };

  return (
    <div>
      {/* Slide-up Add to Cart Price Panel */}
      {showPricePanel && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex md:items-stretch md:justify-end items-end justify-center"
          onClick={() => setShowPricePanel(false)}
        >
          {/* Modal container: right-aligned on md+, bottom-centered on mobile */}
          <div
            className="w-full max-w-lg bg-white shadow-lg p-6 relative transition-all duration-300
              rounded-t-2xl flex flex-col
              md:rounded-t-none md:rounded-l-2xl md:rounded-r-none
              md:fixed md:inset-y-0 md:right-0 md:w-[420px] md:max-w-full md:h-full md:items-stretch
              md:justify-start md:animate-slideInRight
              animate-slideUp"
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { maxHeight: '100vh' } : {}),
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Select Variation</h3>
              <button className="text-2xl px-2" onClick={() => setShowPricePanel(false)}>&times;</button>
            </div>
            <div className="space-y-2 mb-6">
              {variationCombinations.map((comb, idx) => {
                const qty = getCombinationQty(idx);
                const handleAdd = () => {
                  // Add this combination to cart with its quantity
                  // You may want to call a real add-to-cart function here
                  console.log('Added to cart:', {
                    product: product.name,
                    options: comb.options,
                    quantity: qty,
                  });
                };
                return (
                  <div key={idx} className="border-b py-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-sm">{getCombinationLabel(comb)}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">${comb.price}</span>
                        {comb.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">${comb.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCombinationQtyChange(idx, -1)}
                        disabled={comb.inStock === false}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCombinationQtyChange(idx, 1)}
                        disabled={comb.inStock === false}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        className="h-10 text-base ml-2"
                        onClick={handleAdd}
                        disabled={comb.inStock === false}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart - ${comb.price * qty}
                      </Button>
                      {!comb.inStock && (
                        <span className="text-xs text-red-500 ml-2">Out of Stock</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <main>
        <div className="container mx-auto py-2 px-2 mt-14 ">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Product Images */}
            <div className="md:w-1/2">
              <div className="aspect-square w-full mb-4">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {/* Thumbnails */}
              <div className="flex gap-3">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    className={`aspect-square w-16 h-16 overflow-hidden rounded-md border-2 transition-colors ${
                      currentImageIndex === index
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center mb-4">
                <span className="text-yellow-500 flex items-center mr-2">
                  <Star className="w-5 h-5 mr-1" />
                  {avgRating}
                </span>
                <span className="text-sm text-muted-foreground">
                  {reviews.length} reviews
                </span>
              </div>
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl font-light">
                  ${selectedCombination ? selectedCombination.price : product.price}
                </span>
                {(selectedCombination ? selectedCombination.originalPrice : product.originalPrice) && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${selectedCombination ? selectedCombination.originalPrice : product.originalPrice}
                  </span>
                )}
              </div>
              {/* Dynamic Variation Selectors */}
              {variationOptions.map((variation) => (
                <div key={variation.type} className="space-y-3 mb-4">
                  <h3 className="font-medium capitalize">{variation.type}</h3>
                  <div className={variation.values.length > 5 ? "flex flex-wrap gap-2" : "flex items-center space-x-3"}>
                    {variation.values.map((value: string) => (
                      variation.type === 'color' ? (
                        <button
                          key={value}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedOptions[variation.type] === value
                              ? 'border-primary scale-110'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: value.toLowerCase() }}
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [variation.type]: value }))}
                          title={value}
                        />
                      ) : (
                        <Button
                          key={value}
                          variant={selectedOptions[variation.type] === value ? 'default' : 'outline'}
                          className="px-4 py-2 min-w-[2.5rem] text-sm font-medium"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [variation.type]: value }))}
                        >
                          {value}
                        </Button>
                      )
                    ))}
                  </div>
                  {variation.type === 'size' && (
                    <p className="text-sm text-muted-foreground">
                      Need help with sizing?{' '}
                      <a href="#" className="underline">
                        Size Guide
                      </a>
                    </p>
                  )}
                </div>
              ))}
              {/* Action Buttons */}
              <div className="space-y-4 mb-4">
                {hasMultiplePrices ? (
                  <Button
                    className="w-full h-12 text-lg animate-bounceIn"
                    onClick={() => setShowPricePanel(true)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    View All Prices & Variations
                  </Button>
                ) : (
                  <>
                    {/* Quantity and Add to Cart for single-value products */}
                    <div className="space-y-3 mb-2">
                      <h3 className="font-medium">Quantity</h3>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 text-lg"
                      onClick={handleAddToCart}
                      disabled={selectedCombination ? selectedCombination.inStock === false : product.inStock === false}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart - $
                      {(selectedCombination ? selectedCombination.price : product.price) * quantity}
                    </Button>
                  </>
                )}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleToggleWishlist}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${
                        isInWishlist ? 'fill-current text-red-500' : ''
                      }`}
                    />
                    {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Delivery Info */}
              {Array.isArray(product.deliveryInfo) &&
                product.deliveryInfo.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    {product.deliveryInfo.map((info: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 text-sm"
                      >
                        <span>{info.label}:</span>
                        <span>{info.value}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
          {/* Product Details Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details & Care</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-8">
                <div className="prose max-w-none">
                  <p className="text-lg leading-relaxed mb-6">
                    {product.description}
                  </p>
                  {features.length > 0 && (
                    <>
                      <h4 className="font-medium mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {features.map((feature: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-accent mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {detailsAndCare.map((detail: any, idx: number) => (
                    <div key={idx}>
                      <h4 className="font-medium mb-3">{detail.type}</h4>
                      <ul className="text-muted-foreground mb-4">
                        {Array.isArray(detail.value) &&
                          detail.value.map((v: string, i: number) => (
                            <li key={i}>{v}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-8">
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-muted-foreground">No reviews yet.</div>
                  ) : (
                    reviews.map((review: any, idx: number) => {
                      // Try to get the reviewer's name from review.customer.name or review.customer (string)
                      let reviewerName = '';
                      if (review.customer && typeof review.customer === 'object' && review.customer.name) {
                        reviewerName = review.customer.name;
                      } else if (typeof review.customer === 'string') {
                        reviewerName = review.customer;
                      } else {
                        reviewerName = 'User';
                      }
                      const initial = reviewerName.charAt(0).toUpperCase();
                      return (
                        <div key={idx} className="border-b pb-4 mb-4">
                          <div className="flex items-center space-x-3 mb-1">
                            {/* Profile Initial */}
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-lg text-gray-700">
                              {initial}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm text-gray-900">{reviewerName}</span>
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-accent text-accent'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground ml-1">{review.title}</span>
                            </div>
                          </div>
                          <div className="text-sm ml-11">{review.comment}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Related Products */}
        {/* Similar Products Section with Skeletons */}
        <section className="py-10 px-2 bg-muted/30 mt-16 rounded-xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">
              Similar products to {product?.name ? <span className="text-primary">{product.name}</span> : ''}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {(loading || !similarProducts || similarProducts.length === 0)
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow flex flex-col overflow-hidden animate-pulse">
                    <div className="aspect-[3/4] w-full bg-gray-200 flex items-center justify-center relative">
                      <div className="absolute top-2 right-2 flex space-x-2 z-10">
                        <div className="w-9 h-9 rounded-full bg-gray-300" />
                        <div className="w-9 h-9 rounded-full bg-gray-300" />
                      </div>
                      <div className="w-2/3 h-2/3 bg-gray-300 rounded" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                      <div className="flex items-center space-x-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-3 w-3 bg-gray-200 rounded" />
                        ))}
                        <div className="h-3 w-6 bg-gray-200 rounded" />
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-4 w-12 bg-gray-200 rounded" />
                        <div className="h-3 w-8 bg-gray-200 rounded" />
                      </div>
                      <div className="h-8 w-full bg-gray-200 rounded mt-auto" />
                    </div>
                  </div>
                ))
              : similarProducts.map((product: any) => {
                  const image = Array.isArray(product.images) && product.images.length > 0
                    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || '')
                    : '';
                  const price = product.price ?? '--';
                  const originalPrice = product.originalPrice;
                  const rating = Number(product.rating) || 0;
                  const reviews = typeof product.reviews === 'number' ? product.reviews : (Array.isArray(product.reviews) ? product.reviews.length : 0);
                  const name = product.name || '';
                  const brand = product.brand || '';
                  const inStock = product.inStock !== false;
                  return (
                    <div key={product._id || product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col overflow-hidden group relative">
                      <div className="aspect-[3/4] w-full bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        {/* Wishlist and Cart Buttons */}
                        <div className="absolute top-2 right-2 flex space-x-2 z-10">
                          <button
                            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition"
                            title="Add to Wishlist"
                          >
                            <Heart className="h-5 w-5 text-red-500" />
                          </button>
                          <button
                            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="h-5 w-5 text-primary" />
                          </button>
                        </div>
                        {image ? (
                          <img src={image} alt={name} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                        {!inStock && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{brand}</p>
                        <h3 className="font-medium text-base md:text-lg mb-2 truncate" style={{lineHeight: '1.3'}} title={name}>{name}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">({reviews})</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-base md:text-lg">${price}</span>
                          {originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
                          )}
                        </div>
                        <a href={`/product/${product._id || product.id}`} className="mt-auto inline-block w-full text-center py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition">View</a>
                      </div>
                    </div>
                  );
                })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
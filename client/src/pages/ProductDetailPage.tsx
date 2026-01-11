import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Share2, Minus, Plus, ChevronRight, Truck, Shield, RotateCcw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

// Helper to safely render HTML content from rich text editor
const RichTextContent = ({ html, className = '' }: { html: string; className?: string }) => {
  if (!html) return null;
  
  // Decode HTML entities in case they were escaped
  const decodeHtmlEntities = (str: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };
  
  const decodedHtml = decodeHtmlEntities(html);
  
  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert 
        prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground
        prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted
        prose-td:border prose-td:border-border prose-td:p-2
        prose-a:text-primary hover:prose-a:underline
        prose-ul:list-disc prose-ol:list-decimal prose-li:text-foreground
        ${className}`}
      dangerouslySetInnerHTML={{ __html: decodedHtml }}
    />
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  // UI State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showPricePanel, setShowPricePanel] = useState(false);
  
  // Selected variation options (e.g., { "Color": "Red", "Size": "M" })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  // For price panel: track quantity for each combination
  const [combinationQtys, setCombinationQtys] = useState<Record<number, number>>({});

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/products/public/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data.data || data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch related products (prioritizes deepest category level)
  useEffect(() => {
    if (!id) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/products/${id}/related?limit=10`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch related products');
        const data = await res.json();
        setRelatedProducts(data.data || data || []);
      })
      .catch(() => setRelatedProducts([]));
  }, [id]);

  // Extract product data
  const images = useMemo(() => {
    if (!product?.images) return [];
    return product.images
      .filter((img: any) => img && (typeof img === 'string' || img.url))
      .map((img: any) => typeof img === 'string' ? img : img.url);
  }, [product]);

  const variationDefinitions = useMemo(() => {
    return product?.variationDefinitions?.filter((v: any) => v.isActive) || [];
  }, [product]);

  const variationCombinations = useMemo(() => {
    return product?.variationCombinations?.filter((c: any) => c.isActive !== false) || [];
  }, [product]);

  const hasVariations = variationDefinitions.length > 0;
  const hasMultipleCombinations = variationCombinations.length > 1;

  // Set default selected options when product loads
  useEffect(() => {
    if (!variationDefinitions.length) return;
    
    const defaults: Record<string, string> = {};
    variationDefinitions.forEach((variation: any) => {
      const activeValues = variation.values?.filter((v: any) => v.isActive) || [];
      if (activeValues.length > 0) {
        defaults[variation.name] = activeValues[0].value;
      }
    });
    setSelectedOptions(defaults);
  }, [variationDefinitions]);

  // Find selected combination based on selected options
  const selectedCombination = useMemo(() => {
    if (!hasVariations || !variationCombinations.length) return null;
    
    return variationCombinations.find((combo: any) => {
      if (!combo.combination) return false;
      return combo.combination.every((c: any) => 
        selectedOptions[c.variationName] === c.value
      );
    });
  }, [selectedOptions, variationCombinations, hasVariations]);

  // Calculate display price
  const displayPrice = useMemo(() => {
    if (selectedCombination?.price) return selectedCombination.price;
    return product?.currentPrice || product?.price || 0;
  }, [selectedCombination, product]);

  const originalPrice = useMemo(() => {
    if (selectedCombination?.comparePrice) return selectedCombination.comparePrice;
    return product?.originalPrice || product?.comparePrice;
  }, [selectedCombination, product]);

  // Calculate stock
  const inStock = useMemo(() => {
    if (selectedCombination) {
      return (selectedCombination.stock?.quantity || 0) > 0;
    }
    // Check if any variation affects stock
    const stockAffectingVariation = variationDefinitions.find((v: any) => v.affectsStock);
    if (stockAffectingVariation && variationCombinations.length > 0) {
      // Sum all combination stocks
      const totalStock = variationCombinations.reduce((sum: number, c: any) => 
        sum + (c.stock?.quantity || 0), 0
      );
      return totalStock > 0;
    }
    return (product?.stock?.quantity || 0) > 0;
  }, [selectedCombination, variationDefinitions, variationCombinations, product]);

  // Reviews data - ensure it's always an array
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Category breadcrumb
  const categoryPath = useMemo(() => {
    if (!product?.category?.path) return [];
    return product.category.path.split(' > ');
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      productId: product._id,
      name: product.name,
      image: images[0] || '',
      price: displayPrice,
      quantity,
      selectedOptions: hasVariations ? selectedOptions : undefined,
      combinationId: selectedCombination?._id,
      sku: selectedCombination?.sku || product.sku,
    };
    
    addToCart(cartItem);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist({
        productId: product._id,
        name: product.name,
        image: images[0] || '',
        price: displayPrice,
        originalPrice,
      });
    }
  };

  const handleOptionChange = (variationName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [variationName]: value }));
  };

  const handleCombinationQtyChange = (idx: number, delta: number) => {
    setCombinationQtys(prev => ({
      ...prev,
      [idx]: Math.max(1, (prev[idx] ?? 1) + delta),
    }));
  };

  const getCombinationQty = (idx: number) => combinationQtys[idx] ?? 1;

  const getCombinationLabel = (combo: any) => {
    if (!combo?.combination) return '';
    return combo.combination.map((c: any) => `${c.variationName}: ${c.value}`).join(' / ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-4 px-4 mt-16">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image skeleton */}
            <div className="lg:w-1/2">
              <div className="aspect-square w-full bg-gray-200 animate-pulse rounded-lg" />
              <div className="flex gap-2 mt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 animate-pulse rounded-md" />
                ))}
              </div>
            </div>
            {/* Details skeleton */}
            <div className="lg:w-1/2 space-y-4">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <Link to="/" className="text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const productInWishlist = isInWishlist(product._id);

  return (
    <div className="min-h-screen bg-background">
      {/* Variation Selection Panel (Slide-up on mobile, Slide-in on desktop) */}
      {showPricePanel && hasMultipleCombinations && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-stretch md:justify-end"
          onClick={() => setShowPricePanel(false)}
        >
          <div
            className="w-full max-w-lg bg-background shadow-xl p-6 rounded-t-2xl md:rounded-l-2xl md:rounded-t-none md:h-full md:max-h-full max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Select Variation</h3>
              <button
                className="text-2xl hover:text-primary transition-colors"
                onClick={() => setShowPricePanel(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              {variationCombinations.map((combo: any, idx: number) => {
                const qty = getCombinationQty(idx);
                const comboInStock = (combo.stock?.quantity || 0) > 0;
                const comboPrice = combo.price || displayPrice;
                
                return (
                  <div key={combo._id || idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{getCombinationLabel(combo)}</span>
                      <div className="text-right">
                        <span className="text-lg font-semibold">
                          KSh {comboPrice.toLocaleString()}
                        </span>
                        {combo.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            KSh {combo.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {combo.sku && (
                      <p className="text-xs text-muted-foreground mb-2">SKU: {combo.sku}</p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCombinationQtyChange(idx, -1)}
                          disabled={!comboInStock}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCombinationQtyChange(idx, 1)}
                          disabled={!comboInStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        className="flex-1"
                        onClick={() => {
                          addToCart({
                            productId: product._id,
                            name: product.name,
                            image: images[0] || '',
                            price: comboPrice,
                            quantity: qty,
                            selectedOptions: combo.combination?.reduce((acc: any, c: any) => {
                              acc[c.variationName] = c.value;
                              return acc;
                            }, {}),
                            combinationId: combo._id,
                            sku: combo.sku,
                          });
                          setShowPricePanel(false);
                        }}
                        disabled={!comboInStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add - KSh {(comboPrice * qty).toLocaleString()}
                      </Button>
                    </div>
                    
                    {!comboInStock && (
                      <Badge variant="destructive" className="mt-2">Out of Stock</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto py-4 px-4 mt-16">
        {/* Breadcrumb */}
        {categoryPath.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto">
            <Link to="/" className="hover:text-primary">Home</Link>
            {categoryPath.map((cat, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                <span className={idx === categoryPath.length - 1 ? 'text-foreground' : ''}>
                  {cat}
                </span>
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="lg:w-1/2">
            <div className="sticky top-20">
              {/* Main Image */}
              <div className="aspect-square w-full mb-4 bg-gray-100 rounded-lg overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-24 w-24" />
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image: string, index: number) => (
                    <button
                      key={index}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                        currentImageIndex === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-gray-300'
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
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:w-1/2">
            {/* Brand */}
            {product.brand?.name && (
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                {product.brand.name}
              </p>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(Number(avgRating))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {avgRating} ({reviews.length} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">
                KSh {displayPrice.toLocaleString()}
              </span>
              {originalPrice && originalPrice > displayPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    KSh {originalPrice.toLocaleString()}
                  </span>
                  <Badge variant="destructive">
                    {Math.round((1 - displayPrice / originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
              {product.sku && (
                <span className="ml-3 text-sm text-muted-foreground">
                  SKU: {selectedCombination?.sku || product.sku}
                </span>
              )}
            </div>

            {/* Variation Selectors */}
            {hasVariations && !hasMultipleCombinations && (
              <div className="space-y-4 mb-6">
                {variationDefinitions.map((variation: any) => {
                  const activeValues = variation.values?.filter((v: any) => v.isActive) || [];
                  
                  return (
                    <div key={variation._id || variation.name}>
                      <h3 className="font-medium mb-2">
                        {variation.name}: <span className="text-primary">{selectedOptions[variation.name]}</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {activeValues.map((val: any) => {
                          const isSelected = selectedOptions[variation.name] === val.value;
                          
                          // Color variation with color code
                          if (val.colorCode) {
                            return (
                              <button
                                key={val.value}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: val.colorCode }}
                                onClick={() => handleOptionChange(variation.name, val.value)}
                                title={val.displayName || val.value}
                              />
                            );
                          }
                          
                          // Regular button
                          return (
                            <Button
                              key={val.value}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleOptionChange(variation.name, val.value)}
                            >
                              {val.displayName || val.value}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 mb-6">
              {hasMultipleCombinations ? (
                <Button
                  className="w-full h-12 text-lg"
                  onClick={() => setShowPricePanel(true)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  View All Variations & Prices
                </Button>
              ) : (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Quantity</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={!inStock}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                          disabled={!inStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleAddToCart}
                    disabled={!inStock}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart - KSh {(displayPrice * quantity).toLocaleString()}
                  </Button>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleToggleWishlist}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${productInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  {productInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-5 w-5 text-primary" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>Genuine Products</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span>Easy Returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-5 w-5 text-primary" />
                <span>Secure Packaging</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12 lg:mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Description
              </TabsTrigger>
              {product.keyFeatures && (
                <TabsTrigger
                  value="features"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Key Features
                </TabsTrigger>
              )}
              {product.specifications && (
                <TabsTrigger
                  value="specifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Specifications
                </TabsTrigger>
              )}
              {product.whatsInBox && (
                <TabsTrigger
                  value="whatsInBox"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  What's in the Box
                </TabsTrigger>
              )}
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 min-h-[200px]">
              <TabsContent value="description">
                {product.description ? (
                  <RichTextContent html={product.description} />
                ) : (
                  <p className="text-muted-foreground">No description available.</p>
                )}
              </TabsContent>

              <TabsContent value="features">
                <RichTextContent html={product.keyFeatures} />
              </TabsContent>

              <TabsContent value="specifications">
                <RichTextContent html={product.specifications} />
              </TabsContent>

              <TabsContent value="whatsInBox">
                <RichTextContent html={product.whatsInBox} />
              </TabsContent>

              <TabsContent value="reviews">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
                    <Button variant="outline">Write a Review</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: any, idx: number) => {
                      const reviewerName = review.customer?.name || review.customer || 'Anonymous';
                      const initial = reviewerName.charAt(0).toUpperCase();
                      
                      return (
                        <div key={review._id || idx} className="border-b pb-6 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {initial}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{reviewerName}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.title && (
                                <h4 className="font-medium mb-1">{review.title}</h4>
                              )}
                              <p className="text-muted-foreground">{review.comment}</p>
                              {review.createdAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Related Products - From same category tree (prioritizes deepest level) */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 py-10 bg-gradient-to-r from-primary/5 to-secondary/5 -mx-4 px-4 rounded-xl">
            <h2 className="text-2xl font-semibold mb-2 text-center">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((prod: any) => {
                const prodImage = prod.images?.[0]?.url || prod.images?.[0] || '';
                const prodPrice = prod.currentPrice || prod.price || 0;
                const prodOriginalPrice = prod.originalPrice;
                const discount = prodOriginalPrice && prodOriginalPrice > prodPrice
                  ? Math.round(((prodOriginalPrice - prodPrice) / prodOriginalPrice) * 100)
                  : 0;
                
                return (
                  <Link
                    key={prod._id}
                    to={`/product/${prod._id}`}
                    className="bg-background rounded-lg shadow hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                      {prodImage ? (
                        <img
                          src={prodImage}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                      {discount > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      {prod.brand?.name && (
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          {prod.brand.name}
                        </p>
                      )}
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">{prod.name}</h3>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-primary">KSh {prodPrice.toLocaleString()}</span>
                        {prodOriginalPrice && prodOriginalPrice > prodPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            KSh {prodOriginalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;

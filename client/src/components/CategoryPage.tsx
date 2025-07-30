import { useState, useEffect } from 'react';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

const CategoryPage = ({ category }: { category: string }) => {
  // Backgrounds for each category
  const categoryBackgrounds: Record<string, string> = {
    Men: "bg-[url('/src/assets/men.jpg')] bg-cover bg-center",
    Women: "bg-[url('/src/assets/women.jpg')] bg-cover bg-center",
    'New Arrivals': "bg-[url('/src/assets/new-arrivals.jpg')] bg-cover bg-center",
    Collections: "bg-[url('/src/assets/collection.jpg')] bg-cover bg-center",
    Sale: "bg-[url('/src/assets/sale.jpg')] bg-cover bg-center",
  };
  const headerBg = categoryBackgrounds[category] || 'bg-muted/30';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);

  // Fetch products from backend
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseUrl}/api/products/all`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        // Map UI category to backend enum value
        const categoryMap: Record<string, string> = {
          Men: 'men',
          Women: 'women',
          'New Arrivals': 'newarrivals',
          Collections: 'collection',
          Sale: 'sale',
        };
        const backendCategory = categoryMap[category];
        // If category matches, filter products to only those that include the backendCategory in their category array
        let filtered = data;
        if (backendCategory) {
          filtered = data.filter((product: any) => Array.isArray(product.category) && product.category.includes(backendCategory));
        }
        setProducts(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const filters = [
    {
      name: 'Category',
      options: ['Tops', 'Bottoms', 'Outerwear', 'Accessories'],
    },
    {
      name: 'Size',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      name: 'Color',
      options: ['Black', 'White', 'Grey', 'Navy', 'Beige'],
    },
    {
      name: 'Brand',
      options: ['UrbanThreadz', 'Street Elite', 'Minimal Co.'],
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="pt-0">
        {/* Page Header */}
        <div className={`${headerBg} py-16 relative`}>
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="container mx-auto px-4 text-center relative z-10 text-white">
            <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-4">
              {category}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover our curated collection of {category.toLowerCase()} fashion pieces
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {products.length} items
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Select defaultValue="featured">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Best Rating</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar/Modal */}
            {/* Sidebar for md+ screens */}
            {showFilters && (
              <aside className="w-64 space-y-6 hidden md:block">
                <div className="bg-card p-6 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </h3>
                  {/* Price Range */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-sm">Price Range</h4>
                    {/* Slider with two thumbs for min and max price */}
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full slider-thumb-visible"
                      minStepsBetweenThumbs={1}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                  {/* Filter Categories */}
                  {filters.map((filter) => (
                    <div key={filter.name} className="space-y-3 mb-6">
                      <h4 className="font-medium text-sm">{filter.name}</h4>
                      <div className="space-y-2">
                        {filter.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox id={`${filter.name}-${option}`} />
                            <label
                              htmlFor={`${filter.name}-${option}`}
                              className="text-sm cursor-pointer"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              </aside>
            )}
            {/* Modal for small screens */}
            {showFilters && (
              <div className="fixed inset-0 z-50 md:hidden flex items-end">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
                <div className="relative w-full bg-card rounded-t-lg shadow-lg p-6 z-10 overflow-y-auto max-h-[80vh] animate-slideUp">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                    </h3>
                    <Button size="icon" variant="ghost" onClick={() => setShowFilters(false)}>
                      <span className="sr-only">Close</span>
                      ×
                    </Button>
                  </div>
                  {/* Price Range */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-sm">Price Range</h4>
                    {/* Slider with two thumbs for min and max price */}
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full slider-thumb-visible"
                      minStepsBetweenThumbs={1}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                  {/* Filter Categories */}
                  {filters.map((filter) => (
                    <div key={filter.name} className="space-y-3 mb-6">
                      <h4 className="font-medium text-sm">{filter.name}</h4>
                      <div className="space-y-2">
                        {filter.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox id={`${filter.name}-${option}`} />
                            <label
                              htmlFor={`${filter.name}-${option}`}
                              className="text-sm cursor-pointer"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4" onClick={() => setShowFilters(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}


            {/* Products Grid */}
            <div className="flex-1">
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' 
                  : 'grid-cols-1 lg:grid-cols-2'
              }`}>
                {loading ? (
                  Array.from({ length: 16 }).map((_, idx) => (
                    <Skeleton key={idx} className={viewMode === 'grid' ? 'h-64 w-full rounded-lg' : 'h-32 w-full rounded-lg'} />
                  ))
                ) : error ? (
                  <div className="col-span-full text-center py-12 text-red-500">{error}</div>
                ) : products.length === 0 ? (
                  <div className="col-span-full text-center py-12">No products found.</div>
                ) : (
                  products.map((product) => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      viewMode={viewMode}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="default" size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
import { useState } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import collectionImage from '@/assets/collection-showcase.jpg';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock search functionality
  const mockProducts = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Search Result ${i + 1}`,
    brand: 'UrbanThreadz',
    price: Math.floor(Math.random() * 200) + 50,
    originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 200 : null,
    rating: 4 + Math.random(),
    reviews: Math.floor(Math.random() * 200) + 10,
    image: collectionImage,
    colors: ['Black', 'White', 'Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    isNew: Math.random() > 0.7,
    inStock: Math.random() > 0.1,
  }));

  const trendingSearches = [
    'Minimalist blazer',
    'Oversized tee',
    'Wide leg pants',
    'Cropped jacket',
    'Statement accessories',
  ];

  const recentSearches = [
    'Black jeans',
    'White sneakers',
    'Denim jacket',
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      setIsSearching(false);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen">
      <main className="pt-16">
        {/* Search Header */}
        <div className="bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-light tracking-wide mb-6 text-center">
                Search
              </h1>
              
              {/* Search Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 pr-20 text-lg"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSearch}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    onClick={handleSearch}
                    className="h-8"
                    disabled={!searchQuery.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {!searchResults.length && !isSearching && (
            <div className="max-w-4xl mx-auto">
              {/* Trending Searches */}
              <div className="mb-8">
                <h2 className="flex items-center text-xl font-medium mb-4">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trending Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((search) => (
                    <Button
                      key={search}
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch();
                      }}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              <div>
                <h2 className="flex items-center text-xl font-medium mb-4">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <Button
                      key={search}
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => {
                        setSearchQuery(search);
                        handleSearch();
                      }}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {searchResults.length} items found
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-light mb-2">No results found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or browse our categories
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline">Browse Men</Button>
                <Button variant="outline">Browse Women</Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
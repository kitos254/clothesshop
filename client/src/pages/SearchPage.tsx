import { useState, useEffect, useCallback } from 'react';
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

const RECENT_SEARCHES_KEY = 'newran_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const trendingSearches = [
    'Wireless headphones',
    'Smart watch',
    'Bluetooth speaker',
    'Power bank',
    'LED lighting',
    'Kitchen appliances',
    'Home security',
    'Gaming accessories',
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const params = new URLSearchParams({
        search: searchTerm.trim(),
        limit: '50',
        isActive: 'true',
      });
      
      const response = await fetch(`${baseUrl}/api/products/public?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      const products = Array.isArray(data) ? data : (data.data || []);
      
      setSearchResults(products);
      setTotalResults(data.pagination?.totalItems || products.length);
      
      // Save to recent searches
      saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setTotalResults(0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
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
                  placeholder="Search for electronics, home gear, brands..."
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
                    onClick={() => handleSearch()}
                    className="h-8"
                    disabled={!searchQuery.trim() || isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {!hasSearched && !isSearching && (
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
                      onClick={() => handleSuggestionClick(search)}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center text-xl font-medium">
                      <Clock className="h-5 w-5 mr-2" />
                      Recent Searches
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <Button
                        key={search}
                        variant="ghost"
                        className="rounded-full text-muted-foreground"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isSearching && (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Searching for "{searchQuery}"...</p>
            </div>
          )}

          {searchResults.length > 0 && !isSearching && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {totalResults} {totalResults === 1 ? 'item' : 'items'} found
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {searchResults.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {hasSearched && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-light mb-2">No results found</h2>
              <p className="text-muted-foreground mb-6">
                No products match "{searchQuery}". Try different keywords or browse our categories.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => window.location.href = '/categories'}>
                  Browse Categories
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/new-arrivals'}>
                  New Arrivals
                </Button>
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
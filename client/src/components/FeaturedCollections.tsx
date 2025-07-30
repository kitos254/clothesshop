import { useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import collectionImage from '@/assets/collection-showcase.jpg';

const FeaturedCollections = () => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const collections = [
    {
      id: 1,
      name: 'Urban Essentials',
      description: 'Minimalist pieces for everyday luxury',
      image: collectionImage,
      price: 'From $89',
      badge: '🔥 Trending',
      colors: ['Black', 'White', 'Grey'],
    },
    {
      id: 2,
      name: 'Street Elite',
      description: 'Premium streetwear collection',
      image: collectionImage,
      price: 'From $129',
      badge: '🚨 New',
      colors: ['Navy', 'Olive', 'Black'],
    },
    {
      id: 3,
      name: 'Minimal Luxe',
      description: 'Clean lines, maximum impact',
      image: collectionImage,
      price: 'From $159',
      badge: '✨ Limited',
      colors: ['Beige', 'Cream', 'Camel'],
    },
    {
      id: 4,
      name: 'Urban Classics',
      description: 'Timeless pieces reimagined',
      image: collectionImage,
      price: 'From $99',
      badge: '💫 Bestseller',
      colors: ['Charcoal', 'Stone', 'Sage'],
    },
  ];

  return (
    <section className="py-10 px-0">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-section-title mb-4 fade-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
            Featured Collections
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto fade-in-up stagger-1">
            Discover our curated selection of contemporary fashion that defines modern urban style
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              className="product-card group cursor-pointer fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onMouseEnter={() => setHoveredItem(collection.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Image Container */}
              <div className="product-image-container aspect-[3/4] mb-4 relative">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="product-image"
                />
                
                {/* Badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-background/90 text-foreground"
                >
                  {collection.badge}
                </Badge>

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center space-x-3 transition-opacity duration-300 ${
                    hoveredItem === collection.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Collection Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-base sm:text-lg md:text-xl tracking-wide">
                  {collection.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {collection.description}
                </p>
                
                {/* Color Options */}
                <div className="flex items-center space-x-2">
                  {collection.colors.map((color) => (
                    <div
                      key={color}
                      className={`w-4 h-4 rounded-full border border-border ${
                        color === 'Black' ? 'bg-black' :
                        color === 'White' ? 'bg-white' :
                        color === 'Grey' ? 'bg-gray-400' :
                        color === 'Navy' ? 'bg-blue-900' :
                        color === 'Olive' ? 'bg-green-700' :
                        color === 'Beige' ? 'bg-amber-100' :
                        color === 'Cream' ? 'bg-yellow-50' :
                        color === 'Camel' ? 'bg-yellow-600' :
                        color === 'Charcoal' ? 'bg-gray-700' :
                        color === 'Stone' ? 'bg-gray-300' :
                        'bg-green-400'
                      }`}
                      title={color}
                    />
                  ))}
                </div>

                <p className="font-medium text-base sm:text-lg md:text-xl">
                  {collection.price}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button className="btn-secondary">
            View All Collections
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
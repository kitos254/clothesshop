import HeroSection from '@/components/HeroSection';
import FeaturedCollections from '@/components/FeaturedCollections';
import ProductShowcase from '@/components/ProductShowcase';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <FeaturedCollections />
        <ProductShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

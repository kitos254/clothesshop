import { Button } from '@/components/ui/button';
import heroImage1 from '@/assets/hero-fashion-1.jpg';


const HeroSection = () => {
  return (
    <section className="relative h-screen overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage1})` }} />
      <div className="gradient-overlay absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-hero fade-in-up stagger-1 mb-4">
            URBAN-THREADZ
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-wide mb-8 fade-in-up stagger-2">
            Redefining Street Fashion
          </p>
          <div className="flex flex-row gap-4 justify-center fade-in-up stagger-3 ">
            <Button className="bg-black/30 hover:bg-black/50 text-white rounded-full min-w-28">
              Men
            </Button>
            <Button className="bg-black/30 hover:bg-black/50 text-white rounded-full min-w-28">
              Women
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
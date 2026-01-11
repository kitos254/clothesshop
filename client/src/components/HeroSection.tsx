import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/home-hero.png";

const HeroSection = () => {
  return (
    <section className="relative h-[40vh] md:h-[50vh] xl:h-[60vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 flex items-center justify-center m-0">
        <div className="text-center text-white px-2 md:px-4 mx-auto">
          <h1 className="text-hero fade-in-up stagger-1 mb-6 lg:mb-8">
            NEWRAN
          </h1>
          <p className="text-xl md:text-3xl lg:text-4xl font-light tracking-wide mb-12 lg:mb-16 fade-in-up stagger-2 max-w-4xl mx-auto">
            Premium Home Gear & Electronics
          </p>
          <div className="flex flex-col gap-6 lg:gap-8 justify-center fade-in-up stagger-3">
            {/* Primary buttons row */}
            <div className="flex flex-row gap-4 lg:gap-8 justify-center">
              <Link to="/categories">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full min-w-32 lg:min-w-48 lg:h-14 lg:text-lg font-medium shadow-xl">
                  Shop Now
                </Button>
              </Link>
              <Link to="/new-arrivals">
                <Button className="bg-black/30 hover:bg-black/50 text-white rounded-full min-w-32 lg:min-w-48 lg:h-14 lg:text-lg font-medium shadow-xl backdrop-blur-md">
                  New Arrivals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

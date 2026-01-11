import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, ShoppingBag, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import newranLogo from "/newranLogo.png";

type HeaderProps = {
  onCartOpen: () => void;
};

const mainRoutes = [
  "/",
  "/new-arrivals",
  "/sale",
];

const Header = ({ onCartOpen }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Logo animation
  const [logoStyle, setLogoStyle] = useState({
    transform: "translateY(0px) scale(1)",
    opacity: 1,
    pointerEvents: "auto",
    position: "static",
  });
  const [showNavbarLogo, setShowNavbarLogo] = useState(false);

  // Scroll tracking
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  // Always track scroll state and direction for all main routes
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 10);

      // Direction
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (scrollY > lastScrollY.current) {
            setScrollDirection("down");
          } else if (scrollY < lastScrollY.current) {
            setScrollDirection("up");
          }
          lastScrollY.current = scrollY;
          ticking = false;
        });
        ticking = true;
      }

      // Only run logo animation on "/"
      if (location.pathname === "/") {
        const navbarHeight = 64;
        
        // Calculate hero height based on responsive classes
        // Mobile: 40vh, Tablet (md): 50vh, Desktop (xl): 60vh
        let heroHeight;
        if (window.innerWidth >= 1280) { // xl breakpoint
          heroHeight = window.innerHeight * 0.6; // 60vh
        } else if (window.innerWidth >= 768) { // md breakpoint
          heroHeight = window.innerHeight * 0.5; // 50vh
        } else {
          heroHeight = window.innerHeight * 0.4; // 40vh
        }
        
        // Try to find the actual NEWRAN element for more accurate positioning
        const heroElement = document.querySelector('h1.text-hero');
        let triggerPoint;
        
        if (heroElement) {
          // Get the actual position of the NEWRAN text
          const heroRect = heroElement.getBoundingClientRect();
          const heroTopFromDocument = heroRect.top + scrollY;
          // Make it trigger when the text is going behind the header
          triggerPoint = heroTopFromDocument - navbarHeight / 2;
        } else {
          // Fallback: NEWRAN is centered vertically in the hero section
          const heroTextPosition = heroHeight * 0.5;
          triggerPoint = heroTextPosition - navbarHeight / 2;
        }
        
        // Small buffer to fine-tune the transition
        const buffer = 10;
        const adjustedTriggerPoint = triggerPoint + buffer;
        
        if (scrollY < adjustedTriggerPoint) {
          // Hero NEWRAN is still visible, hide navbar text
          const progress = Math.min(scrollY / adjustedTriggerPoint, 1);
          const scale = 1 - 0.1 * progress;
          const translateY = -progress * 10;
          setLogoStyle({
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity: 1 - progress * 0.1,
            pointerEvents: "auto",
            position: "static",
          });
          setShowNavbarLogo(false);
        } else {
          // Hero NEWRAN is behind or close to header, show navbar text
          setLogoStyle({
            transform: "translateY(0px) scale(1)",
            opacity: 0,
            pointerEvents: "none",
            position: "static",
          });
          setShowNavbarLogo(true);
        }
      } else {
        // Always show navbar text on other pages
        setShowNavbarLogo(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll); // Recalculate on resize
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [location.pathname]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/categories" },
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Sale", href: "/sale" },
    { name: "About", href: "/about" },
  ];

  const isMainRoute = mainRoutes.includes(location.pathname.toLowerCase());
  const isActiveRoute = (href: string) => location.pathname === href;

  // NAVBAR color logic
  let navbarBgClass = "";
  let navbarTextClass = "";
  if (isMainRoute) {
    if (scrollDirection === "up" && scrolled) {
      navbarBgClass = "bg-black/60 backdrop-blur-md";
      navbarTextClass = "text-white fill-white";
    } else if (scrolled) {
      navbarBgClass = "bg-black/60 backdrop-blur-md";
      navbarTextClass = "text-white fill-white";
    } else {
      navbarBgClass = "bg-transparent";
      navbarTextClass = "text-white fill-white";
    }
  } else {
    navbarBgClass = "bg-white";
    navbarTextClass = "text-black fill-black";
  }

  // Helper for desktop/mobile nav/icon text coloring
  const getNavTextClass = () => {
    if (isMainRoute) {
      if (scrollDirection === "up" && scrolled) {
        return "text-white hover:text-white/80";
      } else if (scrolled) {
        return "text-white hover:text-white/80";
      } else {
        return "text-white hover:text-white/80";
      }
    } else {
      return "text-black hover:text-black/80";
    }
  };
  const getLogoTextClass = () => {
    if (isMainRoute) {
      if (scrollDirection === "up" && scrolled) {
        return "text-white";
      } else if (scrolled) {
        return "text-white";
      } else {
        return "text-white";
      }
    } else {
      return "text-black";
    }
  };
  const getIconTextClass = () => {
    if (isMainRoute) {
      if (scrollDirection === "up" && scrolled) {
        return "text-white";
      } else if (scrolled) {
        return "text-white";
      } else {
        return "text-white";
      }
    } else {
      return "text-black";
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      location.pathname !== "/" ? "border-b border-gray-200" : ""
    }`}>
      <div className="w-full px-0">
        <div className={`flex items-center justify-between h-12 px-4 transition-colors duration-300 ${navbarBgClass} ${navbarTextClass}`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className={`flex items-center space-x-2 text-2xl font-light tracking-widest transition-all duration-300 ${getLogoTextClass()}`}
              onClick={() => {
                if (isMenuOpen) setIsMenuOpen(false);
              }}
            >
              {/* Logo image - always visible with white background and shadow on all routes */}
              <div className="relative transition-all duration-300 bg-white rounded-full p-0.5 shadow-2xl shadow-black/50">
                <img 
                  src={newranLogo} 
                  alt="NewRan Logo" 
                  className="h-8 w-8 lg:h-10 lg:w-10 object-contain"
                />
              </div>
              {/* Text - conditional visibility */}
              {(location.pathname !== "/" || showNavbarLogo) && (
                <span>NEWRAN</span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors tracking-wide uppercase px-2 py-1 rounded
                  ${getNavTextClass()}
                  ${isActiveRoute(item.href) ? "bg-primary/80 text-white" : ""}
                `}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Icons (Desktop only) */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/search">
              <Button variant="ghost" size="icon" className={getIconTextClass()}>
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link to={isAuthenticated ? "/profile" : "/auth"}>
              <Button variant="ghost" size="icon" className={getIconTextClass()}>
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className={`relative ${getIconTextClass()}`}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/cart">
              <Button
                variant="ghost"
                size="icon"
                className={`relative ${getIconTextClass()}`}
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Search Button (Mobile) */}
          <div className="flex md:hidden items-center space-x-2">
            <Link to="/search">
              <Button variant="ghost" size="icon" className={getIconTextClass()}>
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={getIconTextClass()}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation (Animated dropdown with slide-in) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden w-[80%] h-dvh bg-gray-300 shadow-lg backdrop-blur-sm fixed top-12 right-0 z-40 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <div className="flex flex-col justify-start items-start h-full space-y-6 p-8 pt-16">
                <div className="flex flex-col space-y-4 w-full">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`text-lg font-medium transition-colors tracking-wide uppercase py-3 px-4 rounded text-left
                        ${isActiveRoute(item.href) ? "bg-primary/80 text-white" : "text-foreground/80 hover:text-foreground"}
                      `}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  <Link to={isAuthenticated ? "/profile" : "/auth"} onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center space-x-3 py-3 px-4 text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
                      <User className="h-6 w-6" />
                      <span>{isAuthenticated ? "Profile" : "Account"}</span>
                    </div>
                  </Link>
                  
                  <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center space-x-3 py-3 px-4 text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
                      <Heart className="h-6 w-6" />
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ml-auto">
                          {wishlistCount > 9 ? "9+" : wishlistCount}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <Link to="/cart" onClick={() => setIsMenuOpen(false)}>
                    <div className="flex items-center space-x-3 py-3 px-4 text-lg font-medium text-foreground/80 hover:text-foreground transition-colors">
                      <ShoppingBag className="h-6 w-6" />
                      <span>Cart</span>
                      {cartCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ml-auto">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
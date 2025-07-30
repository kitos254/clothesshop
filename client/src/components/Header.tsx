import { useState, useEffect, useRef } from "react";
import { Menu, X, Search, ShoppingBag, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { AnimatePresence, motion } from "framer-motion";

type HeaderProps = {
  onCartOpen: () => void;
};

const mainRoutes = [
  "/",
  "/men",
  "/women",
  "/new-arrivals",
  "/collections",
  "/sale",
];

const Header = ({ onCartOpen }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
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
        const heroTextOffset = window.innerHeight * 0.4 - navbarHeight / 2;
        if (scrollY < heroTextOffset) {
          const progress = Math.min(scrollY / heroTextOffset, 1);
          const scale = 1 - 0.5 * progress;
          const translateY = -progress * (heroTextOffset - navbarHeight / 2);
          setLogoStyle({
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity: 1,
            pointerEvents: "auto",
            position: "static",
          });
          setShowNavbarLogo(false);
        } else {
          setLogoStyle({
            transform: "translateY(0px) scale(1)",
            opacity: 0,
            pointerEvents: "none",
            position: "static",
          });
          setShowNavbarLogo(true);
        }
      } else {
        setShowNavbarLogo(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const navItems = [
    { name: "Men", href: "/men" },
    { name: "Women", href: "/women" },
    { name: "New Arrivals", href: "/new-arrivals" },
    { name: "Collections", href: "/collections" },
    { name: "Sale", href: "/sale" },
  ];

  const isMainRoute = mainRoutes.includes(location.pathname.toLowerCase());
  const isActiveRoute = (href: string) => location.pathname === href;

  // NAVBAR color logic
  let navbarBgClass = "";
  let navbarTextClass = "";
  if (isMainRoute) {
    if (scrollDirection === "up" && scrolled) {
      navbarBgClass = "bg-white";
      navbarTextClass = "text-black fill-black";
    } else if (scrolled) {
      navbarBgClass = "bg-background/95 backdrop-blur-sm";
      navbarTextClass = "text-foreground";
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
        return "text-black hover:text-black/80";
      } else if (scrolled) {
        return "text-foreground/80 hover:text-foreground";
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
        return "text-black";
      } else if (scrolled) {
        return "text-foreground";
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
        return "text-black";
      } else if (scrolled) {
        return "";
      } else {
        return "text-white";
      }
    } else {
      return "text-black";
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300`}>
      <div className="w-full px-0">
        <div className={`flex items-center justify-between h-16 transition-colors duration-300 ${navbarBgClass} ${navbarTextClass}`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            {(location.pathname !== "/" || showNavbarLogo) && (
              <Link
                to="/"
                className={`text-2xl font-light tracking-widest transition-all duration-300 ${getLogoTextClass()}`}
                onClick={() => {
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
              >
                URBAN-THREADZ
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/search">
              <Button variant="ghost" size="icon" className={getIconTextClass()}>
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
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
              className="md:hidden py-4 border-t w-[80%] border-border p-4 rounded-l-lg bg-gray-300 shadow-lg backdrop-blur-sm ml-auto fixed top-16 right-0 z-40"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors tracking-wide uppercase py-2 px-2 rounded
                      ${isActiveRoute(item.href) ? "bg-primary/80 text-white" : "text-foreground/80 hover:text-foreground"}
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center space-x-4 pt-2">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="icon" className="relative">
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                          {wishlistCount > 9 ? "9+" : wishlistCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/cart" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
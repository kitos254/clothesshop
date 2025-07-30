import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const footerSections = [
    {
      title: 'Shop',
      links: [
        { name: 'Men', href: '#' },
        { name: 'Women', href: '#' },
        { name: 'New Arrivals', href: '#' },
        { name: 'Sale', href: '#' },
        { name: 'Gift Cards', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Size Guide', href: '#' },
        { name: 'Shipping & Returns', href: '#' },
        { name: 'Contact Us', href: '#' },
        { name: 'FAQ', href: '#' },
        { name: 'Track Order', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Sustainability', href: '#' },
        { name: 'Press', href: '#' },
        { name: 'Stores', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-light tracking-wide mb-4">
            Stay in the Loop
          </h3>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            Be the first to know about new collections, exclusive offers, and style inspiration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:border-primary-foreground/40"
            />
            <Button 
              variant="secondary"
              className="px-8 py-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Subscribe
            </Button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-light tracking-widest mb-4">
              URBANTHREADZ
            </h2>
            <p className="text-primary-foreground/80 mb-6 text-sm leading-relaxed">
              Redefining urban fashion with contemporary designs that blend comfort, 
              style, and sustainability for the modern wardrobe.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-medium tracking-wide uppercase mb-4 text-sm">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-primary-foreground/60">
              <span>© 2024 UrbanThreadz. All rights reserved.</span>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-primary-foreground transition-colors">
                  Accessibility
                </a>
              </div>
            </div>
            <div className="text-sm text-primary-foreground/60">
              Free shipping on orders over $100
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
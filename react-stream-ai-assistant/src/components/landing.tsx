import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "./landing/HeroSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { TechStackSection } from "./landing/TechStackSection";
import { CTASection } from "./landing/CTASection";
import { FooterSection } from "./landing/FooterSection";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface LandingProps {
  isAuthenticated: boolean;
}

export function Landing({ isAuthenticated }: LandingProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                AI Content Writer
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { name: 'Features', href: '#features' },
                { name: 'Technology', href: '#technology' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Contact', href: '#contact' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href.replace('#', ''))}
                  className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 font-medium"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
        {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/login")}
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate("/signup")}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
              <div className="px-4 py-4 space-y-4">
                {[
                  { name: 'Features', href: '#features' },
                  { name: 'Technology', href: '#technology' },
                  { name: 'Pricing', href: '#pricing' },
                  { name: 'Contact', href: '#contact' }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 font-medium"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {isAuthenticated ? (
                    <Button 
                      onClick={() => navigate("/dashboard")}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate("/login")}
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => navigate("/signup")}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="technology">
          <TechStackSection />
        </div>
        <div id="pricing">
          <CTASection />
        </div>
      </main>

      {/* Footer */}
      <div id="contact">
        <FooterSection />
      </div>
    </div>
  );
}
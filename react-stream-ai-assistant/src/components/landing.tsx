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

  const navItems = [
    { name: 'EXPLORE', href: '#features' },
    { name: 'STUDIO', href: '#technology' },
    { name: 'CONTACT', href: '#contact' }
  ];

  return (
    <div className="min-h-screen bg-[#012624] font-matter">
      {/* Navigation */}
      <header
        className={`fixed py-4 top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#012624]/90 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-page mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-3 items-center h-20">
            {/* Logo — left */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="justify-self-start flex items-center gap-2 sm:gap-3"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] gradient-aurora flex items-center justify-center">
                <span className="text-[#222222] font-matter font-medium text-[10px] sm:text-xs tracking-wider">S</span>
              </div>
              <span className="text-platinum font-matter font-medium text-base sm:text-lg tracking-tight">
                STREAM
              </span>
            </button>

            {/* Desktop Nav — centered */}
            <nav className="hidden md:flex justify-self-center items-center gap-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href.replace('#', ''))}
                  className="font-matter font-regular text-xs uppercase text-silver-mist hover:text-platinum transition-colors duration-200"
                  style={{ letterSpacing: '0.12em' }}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Auth / CTA — right */}
            <div className="hidden md:flex justify-self-end items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="font-arial text-sm uppercase text-[#222222] gradient-aurora px-[22px] py-4 rounded-[6px] font-regular transition-opacity hover:opacity-90 whitespace-nowrap leading-none"
                  style={{ letterSpacing: '0.08em' }}
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="font-matter font-regular text-xs uppercase text-silver-mist hover:text-platinum transition-colors duration-200"
                    style={{ letterSpacing: '0.12em' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="font-arial text-sm uppercase text-[#222222] gradient-aurora px-[22px] py-4 rounded-[6px] font-regular transition-opacity hover:opacity-90 whitespace-nowrap leading-none"
                    style={{ letterSpacing: '0.08em' }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden justify-self-end p-2 text-silver-mist"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#012624] pb-6">
              <div className="px-4 pt-5 space-y-5">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className="block w-full text-left font-matter font-regular text-xs uppercase text-silver-mist hover:text-platinum transition-colors py-1.5"
                    style={{ letterSpacing: '0.12em' }}
                  >
                    {item.name}
                  </button>
                ))}
                <div className="pt-5 border-t border-white/10 space-y-3">
                  {isAuthenticated ? (
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full font-arial text-sm uppercase text-[#222222] gradient-aurora px-[22px] py-4 rounded-[6px] font-regular text-center leading-none"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      Dashboard
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate("/login")}
                        className="block w-full text-left font-matter font-regular text-xs uppercase text-silver-mist py-1.5"
                        style={{ letterSpacing: '0.12em' }}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => navigate("/signup")}
                        className="w-full font-arial text-sm uppercase text-[#222222] gradient-aurora px-[22px] py-4 rounded-[6px] font-regular text-center leading-none"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

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

      <div id="contact">
        <FooterSection />
      </div>
    </div>
  );
}

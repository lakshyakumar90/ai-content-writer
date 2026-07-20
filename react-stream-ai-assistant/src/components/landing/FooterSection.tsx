import { Twitter, Github, MessageSquare } from "lucide-react";

const footerLinks = [
  { name: "EXPLORE", href: "#features" },
  { name: "STUDIO", href: "#technology" },
  { name: "GET STARTED", href: "#pricing" },
];

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "Discord", icon: MessageSquare, href: "#" },
];

export function FooterSection() {
  return (
    <footer className="bg-[#011d1c]">
      <div className="max-w-page mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-[120px]">
        <div className="flex flex-col sm:flex-row lg:flex-row justify-between gap-8 sm:gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] gradient-aurora flex items-center justify-center">
                <span className="text-[#222222] font-matter font-medium text-[10px] sm:text-xs tracking-wider">S</span>
              </div>
              <span className="text-platinum font-matter font-medium text-base sm:text-lg tracking-tight">
                STREAM
              </span>
            </div>
            <p className="font-matter font-regular text-sm text-silver-mist leading-relaxed">
              An abyssal content studio — AI writing, image generation, and resume analysis in a single instrument-panel interface.
            </p>
          </div>

          {/* Nav */}
          <div>
            <span
              className="font-matter font-medium text-[10px] sm:text-xs uppercase text-silver-mist block mb-4 sm:mb-5"
              style={{ letterSpacing: '0.12em' }}
            >
              Navigation
            </span>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="font-matter font-regular text-[10px] sm:text-xs uppercase text-silver-mist/70 hover:text-platinum transition-colors duration-200"
                    style={{ letterSpacing: '0.12em' }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <span
              className="font-matter font-medium text-[10px] sm:text-xs uppercase text-silver-mist block mb-4 sm:mb-5"
              style={{ letterSpacing: '0.12em' }}
            >
              Connect
            </span>
            <div className="flex gap-3 sm:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[rgba(3,81,75,0.5)] flex items-center justify-center text-silver-mist hover:text-platinum hover:bg-[#003734] transition-all duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 sm:mt-14 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <span className="font-matter font-regular text-[10px] uppercase text-silver-mist/40" style={{ letterSpacing: '0.15em' }}>
            &copy; 2025 Stream. All rights reserved.
          </span>
          <span className="font-matter font-regular text-[10px] uppercase text-silver-mist/40" style={{ letterSpacing: '0.15em' }}>
            Built with the abyss
          </span>
        </div>
      </div>
    </footer>
  );
}

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Mail, 
  Twitter, 
  Github, 
  Linkedin, 
  MessageSquare,
  Heart,
  ArrowUp
} from "lucide-react";
import { motion } from "framer-motion";

export function FooterSection() {
  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Technology", href: "#technology" },
      { name: "Contact", href: "#contact" }
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#", color: "hover:text-blue-400" },
    { name: "GitHub", icon: Github, href: "#", color: "hover:text-gray-400" },
    { name: "LinkedIn", icon: Linkedin, href: "#", color: "hover:text-blue-600" },
    { name: "Discord", icon: MessageSquare, href: "#", color: "hover:text-indigo-400" }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">AI Content Writer</div>
                <div className="text-sm text-gray-400">Powered by AI</div>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-sm">
              Transform your ideas into compelling content with our intelligent writing assistant. 
              From brainstorming to final drafts, we've got you covered.
            </p>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="justify-end"
            >
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-white/10 mt-16 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>© 2025 AI Content Writer. Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by the team</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>All rights reserved</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}


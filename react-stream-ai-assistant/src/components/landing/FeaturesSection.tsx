import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  FileText, 
  Brain, 
  Zap, 
  Shield, 
  Users, 
  Search,
  BarChart3,
  Globe,
  Sparkles,
  Lock,
  Clock,
  CheckCircle,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  // Current Features
  {
    category: "current",
    icon: MessageSquare,
    title: "AI Writing Assistant",
    description: "Get intelligent writing help with OpenAI GPT-4 integration for content creation, editing, and brainstorming.",
    status: "available",
    highlights: ["Real-time chat", "Context awareness", "Multiple writing styles"]
  },
  {
    category: "current", 
    icon: ImageIcon,
    title: "AI Image Generation",
    description: "Create stunning visuals with Google's Gemini 2.5 Flash Image model via OpenRouter.",
    status: "available",
    highlights: ["Text-to-image", "Image analysis", "High quality output"]
  },
  {
    category: "current",
    icon: Search,
    title: "Web Research",
    description: "Get current information and facts with live web search capabilities using Tavily API.",
    status: "available", 
    highlights: ["Real-time data", "Fact checking", "Source citations"]
  },
  {
    category: "current",
    icon: Shield,
    title: "Secure Authentication",
    description: "Enterprise-grade security with JWT authentication and encrypted data transmission.",
    status: "available",
    highlights: ["JWT tokens", "Secure sessions", "Data encryption"]
  },
  {
    category: "current",
    icon: FileText,
    title: "Writing Prompts",
    description: "Get inspired with categorized prompts for business, content, communication, and creative tasks.",
    status: "available",
    highlights: ["Multiple categories", "Custom prompts", "Quick start"]
  },

  // Coming Soon Features
  {
    category: "future",
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your writing productivity, content performance, and AI usage statistics.",
    status: "coming-soon",
    highlights: ["Usage analytics", "Performance metrics", "Productivity insights"]
  },
  {
    category: "future",
    icon: Globe,
    title: "Multi-language Support",
    description: "Write and translate content in multiple languages with advanced AI translation.",
    status: "coming-soon", 
    highlights: ["50+ languages", "Auto-translation", "Cultural adaptation"]
  },
  {
    category: "future",
    icon: Brain,
    title: "Advanced AI Models",
    description: "Access to cutting-edge AI models including Claude, Gemini, and custom fine-tuned models.",
    status: "coming-soon",
    highlights: ["Multiple AI providers", "Model switching", "Custom training"]
  },
  {
    category: "future",
    icon: Zap,
    title: "Workflow Automation",
    description: "Automate repetitive writing tasks with custom workflows and templates.",
    status: "coming-soon",
    highlights: ["Custom workflows", "Template library", "Batch processing"]
  },
  {
    category: "future",
    icon: Lock,
    title: "Enterprise Features",
    description: "Advanced features for teams including SSO, advanced permissions, and API access.",
    status: "coming-soon",
    highlights: ["SSO integration", "Role management", "API access"]
  },
  {
    category: "future",
    icon: Sparkles,
    title: "Content Optimization",
    description: "AI-powered SEO optimization, readability scoring, and content enhancement suggestions.",
    status: "coming-soon",
    highlights: ["SEO optimization", "Readability scores", "Content enhancement"]
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
            Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              create amazing content
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From AI-powered writing assistance to image generation, we provide all the tools you need to bring your ideas to life.
          </p>
        </motion.div>

        {/* Current Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Available Now</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.filter(f => f.category === "current").map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feature.description}
                    </p>
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coming Soon Features */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.filter(f => f.category === "future").map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 opacity-80">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className="border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {feature.description}
                    </p>
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div> */}
      </div>
    </section>
  );
}

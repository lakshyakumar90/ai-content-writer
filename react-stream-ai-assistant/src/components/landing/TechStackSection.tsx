import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";

const techStack = [
  {
    category: "Frontend",
    color: "from-blue-500 to-cyan-500",
    technologies: [
      { name: "React", description: "Modern UI library" },
      { name: "TypeScript", description: "Type-safe development" },
      { name: "Tailwind CSS", description: "Utility-first styling" },
      { name: "Vite", description: "Fast build tool" },
      { name: "Framer Motion", description: "Smooth animations" },
      { name: "Radix UI", description: "Accessible components" }
    ]
  },
  {
    category: "Backend",
    color: "from-green-500 to-emerald-500",
    technologies: [
      { name: "Node.js", description: "JavaScript runtime" },
      { name: "Express", description: "Web framework" },
      { name: "MongoDB", description: "NoSQL database" },
      { name: "JWT", description: "Authentication" },
      // { name: "Socket.io", description: "Real-time communication" },
      { name: "TypeScript", description: "Type-safe backend" }
    ]
  },
  {
    category: "AI & ML",
    color: "from-purple-500 to-pink-500",
    technologies: [
      // { name: "OpenAI GPT-4", description: "Advanced language model" },
      { name: "Google Gemini", description: "Multimodal AI model" },
      { name: "OpenRouter", description: "AI model access" },
      { name: "Tavily API", description: "Web search integration" },
      { name: "Stream Chat", description: "Real-time messaging" },
      // { name: "Custom Agents", description: "Intelligent assistants" }
    ]
  },
  {
    category: "Infrastructure",
    color: "from-orange-500 to-red-500",
    technologies: [
      { name: "Docker", description: "Containerization" },
      { name: "AWS/GCP", description: "Cloud hosting" },
      { name: "CDN", description: "Global distribution" },
      { name: "SSL/TLS", description: "Secure connections" },
      { name: "CI/CD", description: "Automated deployment" },
      { name: "Monitoring", description: "Performance tracking" }
    ]
  }
];

export function TechStackSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mb-4">
            Technology Stack
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Built with{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              cutting-edge technology
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform leverages the latest technologies to deliver a fast, secure, and scalable content creation experience.
          </p>
        </motion.div>

        {/* Tech Stack Grid */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {techStack.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-3 h-8 bg-gradient-to-b ${category.color} rounded-full`}></div>
                    <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {category.technologies.map((tech, techIndex) => (
                      <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: categoryIndex * 0.2 + techIndex * 0.1 }}
                        viewport={{ once: true }}
                        className="group"
                      >
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:bg-white/10">
                          <h4 className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                            {tech.name}
                          </h4>
                          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            {tech.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div> */}

        {/* Stats Section */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { number: "99.9%", label: "Uptime" },
            { number: "< 200ms", label: "Response Time" },
            { number: "24/7", label: "AI Availability" },
            { number: "256-bit", label: "SSL Encryption" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 group-hover:border-purple-400/50 transition-all duration-300 group-hover:bg-white/10">
                <div className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {stat.number}
                </div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Future Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Continuously evolving with the latest AI advancements</span>
          </div>
          <p className="text-gray-400 mt-4 text-sm">
            We regularly integrate new AI models, frameworks, and tools to keep you ahead of the curve.
          </p>
        </motion.div>
      </div>
    </section>
  );
}


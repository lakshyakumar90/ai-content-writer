import { ArrowUpRight, MessageSquare, Image as ImageIcon, Files, Search, Shield, FileText } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Writing Assistant",
    description: "Intelligent writing help with GPT-4 integration for content creation, editing, and brainstorming.",
    highlights: ["Real-time chat", "Context awareness", "Multiple writing styles"]
  },
  {
    icon: ImageIcon,
    title: "AI Image Generation",
    description: "Create stunning visuals with Google's Gemini 2.5 Flash Image model via OpenRouter.",
    highlights: ["Text-to-image", "High quality output"]
  },
  {
    icon: Files,
    title: "AI Resume Analyzer",
    description: "Analyze your resume with Gemini 2.5 Flash for ATS compatibility and insights.",
    highlights: ["Resume analysis", "Information extraction"]
  },
  {
    icon: Search,
    title: "Web Research",
    description: "Get current information with live web search capabilities using Tavily API.",
    highlights: ["Real-time data", "Fact checking", "Source citations"]
  },
  {
    icon: Shield,
    title: "Secure Auth",
    description: "Enterprise-grade security with JWT authentication and encrypted data transmission.",
    highlights: ["JWT tokens", "Secure sessions"]
  },
  {
    icon: FileText,
    title: "Writing Prompts",
    description: "Inspired prompts for business, content, communication, and creative writing.",
    highlights: ["Multiple categories", "Custom prompts"]
  },
];

export function FeaturesSection() {
  return (
    <section className="py-12 sm:py-[68px] bg-[#012624]">
      <div className="max-w-page mx-auto px-5 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <span className="w-8 h-px bg-silver-mist/40" />
          <span
            className="font-matter font-medium text-xs uppercase text-silver-mist"
            style={{ letterSpacing: '0.12em' }}
          >
            EXPLORE
          </span>
        </div>

        <h2
          className="font-matter font-medium text-platinum leading-none mb-10 sm:mb-14 max-w-3xl"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.04em' }}
        >
          Everything you need to create
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#003734] rounded-[16px] p-6 sm:p-7 lg:p-8 flex flex-col group"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                <div className="w-8 h-8 rounded-[6px] bg-[rgba(3,81,75,0.5)] flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-platinum" />
                </div>
                <div className="w-8 h-8 rounded-[6px] bg-[rgba(3,81,75,0.5)] flex items-center justify-center group-hover:opacity-80 transition-opacity shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-platinum" />
                </div>
              </div>
              <h3
                className="font-matter font-medium text-platinum leading-none mb-2 sm:mb-3"
                style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}
              >
                {feature.title}
              </h3>
              <p className="font-matter font-regular text-silver-mist text-sm leading-relaxed mb-4 sm:mb-5 flex-1">
                {feature.description}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {feature.highlights.map((h, idx) => (
                  <span
                    key={idx}
                    className="font-matter font-regular text-[10px] uppercase text-silver-mist/70 border border-silver-mist/20 rounded-[6px] px-2 py-1"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

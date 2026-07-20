import { ArrowUpRight, Cpu, Palette, Server, Workflow } from "lucide-react";

const divisions = [
  {
    icon: Cpu,
    title: "Proprietary Engine",
    description: "React + TypeScript frontend with Node.js/Express backend on MongoDB. Real-time messaging via Stream Chat for responsive AI interactions.",
    tags: ["React", "TypeScript", "Node.js", "MongoDB"]
  },
  {
    icon: Palette,
    title: "AI Models",
    description: "Multi-model architecture — Google Gemini 2.5 Flash for image generation and resume analysis, GPT-4 for writing, Tavily for web search.",
    tags: ["Gemini 2.5", "GPT-4", "OpenRouter", "Tavily"]
  },
  {
    icon: Server,
    title: "Infrastructure",
    description: "Containerized Docker deployment on cloud infrastructure with CI/CD pipelines, SSL/TLS encryption, and 99.9% uptime monitoring.",
    tags: ["Docker", "AWS/GCP", "CI/CD", "SSL/TLS"]
  },
  {
    icon: Workflow,
    title: "Studio Workflows",
    description: "Three integrated studios — Writing Studio for content, Image Studio for visuals, and Resume Studio for career analysis.",
    tags: ["Writing", "Image Gen", "Resume AI"]
  },
];

export function TechStackSection() {
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
            STUDIO
          </span>
        </div>

        <h2
          className="font-matter font-medium text-platinum leading-none mb-10 sm:mb-14 max-w-3xl"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.04em' }}
        >
          Built with cutting-edge technology
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {divisions.map((div) => (
            <div
              key={div.title}
              className="rounded-[16px] py-8 sm:py-10 lg:py-12 px-6 sm:px-7 lg:px-9 flex flex-col group hover:bg-[#003734] transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] bg-[#003734] flex items-center justify-center group-hover:bg-[rgba(3,81,75,0.5)] transition-colors shrink-0">
                  <div.icon className="w-4 h-4 sm:w-5 sm:h-5 text-platinum" />
                </div>
                <div className="w-8 h-8 rounded-[6px] bg-[rgba(3,81,75,0.5)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-platinum" />
                </div>
              </div>
              <h3
                className="font-matter font-medium text-platinum leading-none mb-2 sm:mb-3"
                style={{ fontSize: 'clamp(1.15rem, 2vw, 1.75rem)' }}
              >
                {div.title}
              </h3>
              <p className="font-matter font-regular text-silver-mist text-sm leading-relaxed">
                {div.description}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                {div.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-matter font-regular text-[10px] uppercase text-silver-mist/60 border border-silver-mist/15 rounded-[6px] px-2 py-1"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    {tag}
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

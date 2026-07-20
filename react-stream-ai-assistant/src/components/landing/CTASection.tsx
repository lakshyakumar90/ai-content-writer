import { useNavigate } from "react-router-dom";

const benefits = [
  "Start writing in seconds",
  "No credit card required",
  "Access to all features",
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "1M+", label: "Content Created" },
  { value: "4.9/5", label: "User Rating" },
  { value: "99.9%", label: "Uptime" },
];

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-[68px] bg-[#012624]">
      <div className="max-w-page mx-auto px-5 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-8 sm:mb-12">
          <span className="w-8 h-px bg-silver-mist/40" />
          <span
            className="font-matter font-medium text-xs uppercase text-silver-mist"
            style={{ letterSpacing: '0.12em' }}
          >
            GET STARTED
          </span>
        </div>

        {/* Recessed card */}
        <div className="bg-[#011d1c] rounded-[16px] py-16 sm:py-20 lg:py-[120px] px-5 sm:px-8 lg:px-9 text-center">
          <h2
            className="font-matter font-medium text-platinum leading-none mb-5 sm:mb-6 max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', letterSpacing: '-0.04em' }}
          >
            Ready to revolutionize your content creation?
          </h2>
          <p
            className="font-matter font-regular text-silver-mist max-w-lg mx-auto mb-8 sm:mb-10 px-2"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)', lineHeight: '1.5' }}
          >
            Join thousands of creators already using AI to create better content faster. No setup required.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
            {benefits.map((benefit) => (
              <span
                key={benefit}
                className="font-matter font-regular text-[10px] uppercase text-liquid-mist/80 border border-platinum/10 rounded-[6px] px-2.5 sm:px-3 py-1.5"
                style={{ letterSpacing: '0.15em' }}
              >
                {benefit}
              </span>
            ))}
          </div>

          {/* Gradient pill CTA */}
          <button
            onClick={() => navigate("/signup")}
            className="font-arial text-sm uppercase text-[#222222] gradient-aurora px-8 py-3 rounded-[6px] font-regular transition-opacity hover:opacity-90"
            style={{ letterSpacing: '0.08em' }}
          >
            Get Started Free
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mt-12 sm:mt-16 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div
                className="font-matter font-medium text-lavender-phosphor leading-none mb-1 sm:mb-2"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
                  letterSpacing: '-0.04em',
                }}
              >
                {stat.value}
              </div>
              <div
                className="font-matter font-regular text-[10px] sm:text-xs uppercase text-silver-mist"
                style={{ letterSpacing: '0.12em' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

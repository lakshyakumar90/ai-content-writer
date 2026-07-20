import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1440px'
			}
		},
		extend: {
			fontFamily: {
				matter: ['Matter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
				arial: ['Arial', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
			},
			fontWeight: {
				regular: '400',
				medium: '500',
			},
			colors: {
				'liquid-abyss': '#012624',
				'liquid-deep': '#011d1c',
				'liquid-kelp': '#003734',
				'liquid-mist': '#edfffe',
				platinum: '#ffffff',
				'silver-mist': '#bbc7c6',
				ash: '#f2f2f2',
				'slate-deep': '#707777',
				'lavender-phosphor': '#fde9ff',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},

			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'cards': '16px',
				'small': '6px',
				'buttons': '6px',
			},
			fontSize: {
				'caption': ['10px', { lineHeight: '1.4', letterSpacing: '1.5px' }],
				'body': ['16px', { lineHeight: '1.4' }],
				'subheading': ['24px', { lineHeight: '1.3', letterSpacing: '-0.48px' }],
				'heading': ['36px', { lineHeight: '1' }],
				'heading-lg': ['61px', { lineHeight: '1', letterSpacing: '-2.44px' }],
				'display': ['96px', { lineHeight: '1', letterSpacing: '-3.84px' }],
			},
			letterSpacing: {
				'tight-display': '-0.046em',
				'tight-lg': '-0.04em',
				'tight-sub': '-0.02em',
				'wide-label': '0.08em',
				'wide-sm': '0.12em',
				'wide-xs': '0.15em',
			},
			maxWidth: {
				'page': '1440px',
			},
			gap: {
				'section': '68px',
				'element': '20px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'drift': {
					'0%, 100%': { transform: 'translate(0, 0)' },
					'25%': { transform: 'translate(10px, -10px)' },
					'50%': { transform: 'translate(-5px, 5px)' },
					'75%': { transform: 'translate(8px, -5px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'drift': 'drift 8s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

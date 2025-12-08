import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: "hsl(var(--card))",
                primary: "hsl(var(--primary))",
                secondary: "hsl(var(--secondary))",
                accent: "hsl(var(--accent))",
                muted: "hsl(var(--muted))",
                border: "hsl(var(--border))",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                'gradient': 'gradient-shift 3s ease infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
};

export default config;

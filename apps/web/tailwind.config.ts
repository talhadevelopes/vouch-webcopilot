import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vouch: {
          red: "#dc2626",
          darkRed: "#b91c1c",
        },
      },
      fontFamily: {
        cabinet: ["Cabinet Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

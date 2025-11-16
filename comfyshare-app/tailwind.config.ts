import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "writebook-blue": "#0f172a",
      },
    },
  },
  plugins: [],
}

export default config

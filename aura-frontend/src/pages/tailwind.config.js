// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",        // bg-primary
        "primary-dark": "#4f46e5"  // hover:bg-primary-dark
      },
    },
  },
  plugins: [],
};


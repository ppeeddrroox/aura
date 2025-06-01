// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",        // indigo-500
        "primary-dark": "#4f46e5", // indigo-600
        accent: "#a855f7",         // purple-500
        "accent-dark": "#9333ea",  // purple-600
        success: "#10b981",        // emerald-500
        warning: "#f59e0b",        // amber-500
        danger: "#ef4444",         // red-500
        neutral: "#f3f4f6",        // gray-100
        surface: "#ffffff",        // blanco fondo
      },
    },
  },
  plugins: [],
};


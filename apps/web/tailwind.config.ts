import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070b",
        panel: "#0b1220",
        line: "#172033",
        back: "#2f8cff",
        lay: "#ff5f8f",
        // Trading-specific colors
        "back-light": "rgba(47, 140, 255, 0.1)",
        "lay-light": "rgba(255, 95, 143, 0.1)",
        "back-dark": "#1a5bb8",
        "lay-dark": "#cc4a72",
      },
      // Enhanced responsive breakpoints for trading platform
      screens: {
        'xs': '375px',     // Small phones
        'sm': '640px',     // Phones
        'md': '768px',     // Tablets
        'lg': '1024px',    // Small laptops
        'xl': '1280px',    // Laptops
        '2xl': '1536px',   // Desktops
        '3xl': '1920px',   // Large desktops
        'trading-sm': '860px',  // Minimum for trading interface
        'trading-md': '1024px', // Comfortable trading
        'trading-lg': '1280px', // Optimal trading
      },
      // Responsive font sizes
      fontSize: {
        'xxs': '0.625rem', // 10px
        'trading-xs': '0.6875rem', // 11px
        'trading-sm': '0.75rem',   // 12px
        'trading-base': '0.8125rem', // 13px
      },
      // Spacing for trading UI
      spacing: {
        'trading-1': '0.125rem',  // 2px
        'trading-2': '0.25rem',   // 4px
        'trading-3': '0.375rem',  // 6px
        'trading-4': '0.5rem',    // 8px
        'trading-5': '0.625rem',  // 10px
        'trading-6': '0.75rem',   // 12px
        '18': '4.5rem',           // 72px
        '22': '5.5rem',           // 88px
      },
      // Border radius for trading cards
      borderRadius: {
        'trading-sm': '0.375rem',
        'trading': '0.5rem',
        'trading-md': '0.625rem',
        'trading-lg': '0.75rem',
        'trading-xl': '1rem',
      },
      // Animation for trading interactions
      animation: {
        'price-flash-up': 'priceFlashUp 0.3s ease-in-out',
        'price-flash-down': 'priceFlashDown 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
      },
      keyframes: {
        priceFlashUp: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
        },
        priceFlashDown: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      // Grid templates for trading layouts
      gridTemplateColumns: {
        'trading-sm': 'repeat(auto-fit, minmax(120px, 1fr))',
        'trading-md': 'repeat(auto-fit, minmax(150px, 1fr))',
        'trading-lg': 'repeat(auto-fit, minmax(180px, 1fr))',
        'odds-ladder': 'auto 1fr 1fr 1fr 1fr 1fr',
        'odds-ladder-mobile': 'auto 1fr 1fr 1fr',
      },
    },
  },
  plugins: [],
  // Responsive variants for trading platform
  variants: {
    extend: {
      display: ['responsive', 'hover', 'focus', 'group-hover'],
      opacity: ['responsive', 'hover', 'focus', 'group-hover'],
      backgroundColor: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
      textColor: ['responsive', 'hover', 'focus', 'group-hover'],
      borderColor: ['responsive', 'hover', 'focus', 'group-hover'],
      scale: ['responsive', 'hover', 'focus', 'active'],
      translate: ['responsive', 'hover', 'focus', 'active'],
    },
  },
};
export default config;

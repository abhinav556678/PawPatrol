/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { 
        primary: '#f97316',
        'brand-cream': '#FFFBF7', 
        'brand-tan': '#B47B49',   
        'brand-brown': '#854D0E', 
        'brand-sage': '#708074',  
      },
      boxShadow: {
        'soft': '0 10px 40px rgba(133, 77, 14, 0.06)', 
      }
    },
  },
  plugins: [],
}
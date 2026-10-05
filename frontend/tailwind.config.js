/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/features/3d-decor/**/*.{js,jsx}",
    "./src/pages/DesignResult.jsx",
  ],
  corePlugins: {
    // Tắt preflight để không ảnh hưởng đến CSS gốc của toàn dự án Homely
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

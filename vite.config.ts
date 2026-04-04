import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/workout-vantage/",
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workout Vantage',
        short_name: 'WorkoutVantage',
        theme_color: '#ffffff',
        icons: [] // You can add icons later
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

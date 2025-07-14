import { createClient } from "@supabase/supabase-js"

// 📌 PLACEHOLDERS - Reemplazar con tus credenciales reales
const supabaseUrl = "https://sxthiwoqxpusgnaeixpo.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dGhpd29xeHB1c2duYWVpeHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNTE4NjMsImV4cCI6MjA2NzcyNzg2M30.6ueHkq88k70u_PzX409K7JegNnOXpI_5WfRmlVLmK2Y"

console.log("Conectando a:", supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración adicional si es necesaria
export const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}

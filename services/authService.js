import { supabase } from "./supabaseClient"

export const authService = {
  // Iniciar sesión
  async signIn(email, password) {
    try {
      console.log("Iniciando sesión para:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Error en signIn:", error)
        throw error
      }

      if (data.user && data.session) {
        console.log("Autenticación exitosa, obteniendo perfil...")

        // Obtener perfil del usuario
        const profile = await this.getUserProfile(data.user.id)

        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario")
        }

        console.log("Perfil obtenido en signIn:", {
          id: profile.id,
          nombre: profile.nombre,
          rol: profile.rol,
        })

        return {
          user: data.user,
          session: data.session,
          profile: profile,
        }
      }

      throw new Error("Datos de autenticación incompletos")
    } catch (error) {
      console.error("Error en authService.signIn:", error)
      throw error
    }
  },

  // Cerrar sesión
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Error en signOut:", error)
      throw error
    }
  },

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error("Error obteniendo sesión actual:", error)
      throw error
    }
  },

  // Obtener perfil del usuario
  async getUserProfile(userId) {
    try {
      console.log("Obteniendo perfil para usuario ID:", userId)

      const { data, error } = await supabase.from("perfiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error obteniendo perfil:", error)
        throw error
      }

      if (!data) {
        console.warn("No se encontró perfil para el usuario:", userId)
        return null
      }

      console.log("Perfil encontrado:", {
        id: data.id,
        nombre: data.nombre,
        rol: data.rol,
        email: data.email,
      })

      return data
    } catch (error) {
      console.error("Error en getUserProfile:", error)
      throw error
    }
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error("Error obteniendo usuario actual:", error)
      throw error
    }
  },
}

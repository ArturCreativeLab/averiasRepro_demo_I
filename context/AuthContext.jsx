"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authService } from "../services/authService"

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    // Verificar sesión inicial
    checkSession()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await handleUserSession(session)
      } else if (event === "SIGNED_OUT") {
        handleSignOut()
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const checkSession = async () => {
    try {
      const session = await authService.getCurrentSession()
      if (session) {
        await handleUserSession(session)
      } else {
        // No hay sesión activa
        setLoading(false)
      }
    } catch (error) {
      console.error("Error verificando sesión:", error)
      setLoading(false) // Asegurar que loading se establezca en false
    }
  }

  const handleUserSession = async (session) => {
    try {
      setSession(session)
      setUser(session.user)

      console.log("Obteniendo perfil para usuario:", session.user.id)

      // Obtener perfil del usuario
      const profile = await authService.getUserProfile(session.user.id)
      if (profile) {
        console.log("Perfil de usuario cargado exitosamente:", {
          id: profile.id,
          nombre: profile.nombre,
          rol: profile.rol,
          email: profile.email,
        })
        setUserProfile(profile)
      } else {
        console.warn("No se pudo obtener el perfil del usuario")
        setError("No se pudo cargar el perfil del usuario")
      }
      setLoading(false)
    } catch (error) {
      console.error("Error obteniendo perfil:", error)
      setError("Error al cargar el perfil del usuario")
      setLoading(false) // Establecer loading en false incluso si hay error
      // No hacer signOut automático, solo loggear el error
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setUserProfile(null)
    setSession(null)
    setLoading(false)
    setError("")
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError("")

      const result = await authService.signIn(email, password)

      if (result.user && result.session && result.profile) {
        setSession(result.session)
        setUser(result.user)
        setUserProfile(result.profile)
        console.log("SignIn exitoso. Perfil establecido:", {
          id: result.profile.id,
          nombre: result.profile.nombre,
          rol: result.profile.rol,
        })
        return { success: true }
      } else {
        throw new Error("Error en la autenticación")
      }
    } catch (error) {
      setLoading(false)
      return {
        success: false,
        error: error.message || "Error al iniciar sesión",
      }
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      handleSignOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return userProfile?.rol === role
  }

  // Verificar si el usuario tiene uno de varios roles
  const hasAnyRole = (roles) => {
    return roles.includes(userProfile?.rol)
  }

  // Verificar permisos según jerarquía de roles
  const canAccess = (requiredLevel) => {
    const roleHierarchy = {
      superusuario: 4,
      jefe_tecnico: 3,
      oficina: 2,
      tecnico: 1,
    }

    const userLevel = roleHierarchy[userProfile?.rol] || 0
    const requiredLevelNum = roleHierarchy[requiredLevel] || 0

    return userLevel >= requiredLevelNum
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    canAccess,
    isAuthenticated: !!user && !!userProfile,
    role: userProfile?.rol,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

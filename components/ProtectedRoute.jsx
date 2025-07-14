"use client"

import { useAuth } from "../context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [], requiredLevel = null }) => {
  const { isAuthenticated, loading, hasRole, hasAnyRole, canAccess } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (!loading && isAuthenticated) {
      // Verificar rol específico
      if (requiredRole && !hasRole(requiredRole)) {
        router.push("/unauthorized")
        return
      }

      // Verificar múltiples roles
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        router.push("/unauthorized")
        return
      }

      // Verificar nivel jerárquico
      if (requiredLevel && !canAccess(requiredLevel)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [loading, isAuthenticated, requiredRole, requiredRoles, requiredLevel])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

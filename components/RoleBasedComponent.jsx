"use client"

import { useAuth } from "../context/AuthContext"

export const RoleBasedComponent = ({
  children,
  requiredRole = null,
  requiredRoles = [],
  requiredLevel = null,
  fallback = null,
}) => {
  const { hasRole, hasAnyRole, canAccess } = useAuth()

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback
  }

  // Verificar múltiples roles
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return fallback
  }

  // Verificar nivel jerárquico
  if (requiredLevel && !canAccess(requiredLevel)) {
    return fallback
  }

  return children
}

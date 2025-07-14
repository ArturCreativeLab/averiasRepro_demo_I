"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { authService } from "../services/authService"

export const Sidebar = () => {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await authService.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const menuItems = [
    {
      name: "Inicio",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      href: "/dashboard",
      active: pathname === "/dashboard",
      roles: ["tecnico", "oficina", "jefe_tecnico", "superusuario"], // Todos pueden ver inicio
    },
    {
      name: "Averías",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      href: "/averias",
      active: pathname === "/averias",
      roles: ["oficina", "jefe_tecnico", "superusuario"], // Técnicos NO pueden ver averías
    },
    {
      name: "Visitas",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      href: "/visitas",
      active: pathname === "/visitas",
      roles: ["tecnico", "oficina", "jefe_tecnico", "superusuario"], // Todos pueden ver visitas
    },
    {
      name: "Configuración",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: "/configuracion",
      active: pathname === "/configuracion",
      roles: ["superusuario"], // Solo superusuario puede ver configuración
    },
  ]

  // Filtrar elementos del menú según el rol del usuario
  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(userProfile?.rol))

  const getRoleLabel = (role) => {
    const labels = {
      superusuario: "Superusuario",
      jefe_tecnico: "Jefe Técnico",
      oficina: "Oficina",
      tecnico: "Técnico",
    }
    return labels[role] || role
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Reproexprés</h2>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {userProfile?.nombre ? userProfile.nombre.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.nombre || "Usuario"}</p>
            <p className="text-xs text-gray-500 truncate">{getRoleLabel(userProfile?.rol)}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {visibleMenuItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
              item.active
                ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className={`mr-3 ${item.active ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`}>
              {item.icon}
            </span>
            {item.name}
          </a>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-3 text-gray-400 group-hover:text-red-500">
            {isLoggingOut ? (
              <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
          </span>
          {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
        </button>
      </div>
    </div>
  )
}

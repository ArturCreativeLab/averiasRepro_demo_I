"use client"

import { useAuth } from "../context/AuthContext"
import { useRouter } from "next/navigation"

export const Navbar = () => {
  const { userProfile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      superusuario: "bg-purple-100 text-purple-800",
      jefe_tecnico: "bg-blue-100 text-blue-800",
      oficina: "bg-green-100 text-green-800",
      tecnico: "bg-yellow-100 text-yellow-800",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Gestor de Averías - Reproexprés</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">{userProfile?.nombre}</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userProfile?.rol)}`}
              >
                {getRoleLabel(userProfile?.rol)}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

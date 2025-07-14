"use client"

import { useAuth } from "../../context/AuthContext"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import { DashboardLayout } from "../../components/DashboardLayout"

export default function DashboardPage() {
  const { userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Panel de Control"
        subtitle={`Bienvenido${userProfile?.nombre ? `, ${userProfile.nombre}` : " al sistema Reproexprés"}`}
      >
        {/* Welcome Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {userProfile?.nombre ? `Bienvenido, ${userProfile.nombre}` : "Bienvenido al sistema Reproexprés"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sistema de gestión de averías técnicas para equipos de impresión
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Solo visible para roles que pueden ver averías */}
        {(userProfile?.rol === "oficina" ||
          userProfile?.rol === "jefe_tecnico" ||
          userProfile?.rol === "superusuario") && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Averías</dt>
                      <dd className="text-2xl font-bold text-gray-900">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Abiertas</dt>
                      <dd className="text-2xl font-bold text-gray-900">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded bg-yellow-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                      <dd className="text-2xl font-bold text-gray-900">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Cerradas</dt>
                      <dd className="text-2xl font-bold text-gray-900">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Módulos Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {userProfile?.rol === "tecnico" ? "Mis Módulos" : "Módulos del Sistema"}
              </h3>
              <div className="space-y-3">
                {/* Módulo de Averías - Solo visible para oficina, jefe_tecnico y superusuario */}
                {(userProfile?.rol === "oficina" ||
                  userProfile?.rol === "jefe_tecnico" ||
                  userProfile?.rol === "superusuario") && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Gestión de Averías</span>
                        {userProfile?.rol === "oficina" && (
                          <p className="text-xs text-gray-500">Registrar y cerrar averías</p>
                        )}
                        {(userProfile?.rol === "jefe_tecnico" || userProfile?.rol === "superusuario") && (
                          <p className="text-xs text-gray-500">Gestión completa de averías</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">En desarrollo</span>
                  </div>
                )}

                {/* Módulo de Visitas - Visible para todos */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Control de Visitas</span>
                      {userProfile?.rol === "tecnico" && <p className="text-xs text-gray-500">Mis visitas asignadas</p>}
                      {userProfile?.rol === "oficina" && <p className="text-xs text-gray-500">Registrar visitas</p>}
                      {(userProfile?.rol === "jefe_tecnico" || userProfile?.rol === "superusuario") && (
                        <p className="text-xs text-gray-500">Gestión y edición de visitas</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">En desarrollo</span>
                </div>

                {/* Módulo de Configuración - Solo superusuario */}
                {userProfile?.rol === "superusuario" && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center mr-3">
                        <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Configuración</span>
                        <p className="text-xs text-gray-500">Configuración del sistema</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">En desarrollo</span>
                  </div>
                )}

                {/* Mensaje especial para técnicos */}
                {userProfile?.rol === "tecnico" && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Panel de Técnico</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Desde aquí podrás gestionar tus visitas asignadas y completar los reportes técnicos.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {userProfile?.rol === "tecnico" ? "Mi Estado" : "Estado del Sistema"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">
                    {userProfile?.rol === "tecnico" ? "Conectado al sistema" : "Base de datos conectada"}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Autenticación activa</span>
                </div>
                {userProfile?.rol === "tecnico" ? (
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Esperando asignación de visitas</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Módulos en desarrollo</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        {userProfile?.rol === "tecnico" ? "Información importante" : "Sistema en desarrollo"}
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          {userProfile?.rol === "tecnico"
                            ? "Pronto podrás ver y gestionar tus visitas técnicas asignadas desde este panel."
                            : "La estructura base está lista. Los módulos específicos se implementarán próximamente."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

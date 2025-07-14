"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import { DashboardLayout } from "../../components/DashboardLayout"
import { averiasService } from "../../services/averiasService"
import { ModalNuevaAveria } from "../../components/ModalNuevaAveria"
import { useRouter } from "next/navigation"

export default function AveriasPage() {
  const { userProfile, user } = useAuth()
  const router = useRouter()
  const [averias, setAverias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: "",
    urgencia: "",
    id_tecnico_asignado: "",
    tipo_averia: "",
    fecha_desde: "",
    fecha_hasta: "",
  })
  const [tecnicosParaFiltro, setTecnicosParaFiltro] = useState([])
  const [filtrosActivos, setFiltrosActivos] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Verificar si el usuario puede acceder a este módulo
  const canAccessAverias = ["oficina", "jefe_tecnico", "superusuario", "tecnico"].includes(userProfile?.rol)

  // Función para cargar averías con debounce
  const cargarAverias = useCallback(async () => {
    if (!userProfile) return

    try {
      setLoading(true)
      setError("")
      const data = await averiasService.listarAveriasFiltrado(userProfile.rol, user.id, filtros, searchTerm)
      setAverias(data)
    } catch (error) {
      console.error("Error cargando averías:", error)
      setError("Error al cargar las averías. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }, [userProfile, user, filtros, searchTerm])

  // Debounce para la búsqueda
  useEffect(() => {
    if (!userProfile || !canAccessAverias) return

    const timeoutId = setTimeout(() => {
      cargarAverias()
    }, 300) // 300ms de debounce

    return () => clearTimeout(timeoutId)
  }, [cargarAverias, userProfile, canAccessAverias])

  useEffect(() => {
    if (userProfile && canAccessAverias) {
      // Cargar técnicos para filtro solo si puede verlos
      if (["superusuario", "oficina"].includes(userProfile?.rol)) {
        cargarTecnicosParaFiltro()
      }
    } else if (userProfile && !canAccessAverias) {
      setError("No tienes permisos para acceder a este módulo")
      setLoading(false)
    }
  }, [userProfile, canAccessAverias])

  // Verificar si hay filtros activos (incluyendo búsqueda)
  useEffect(() => {
    const hayFiltros = Object.values(filtros).some((valor) => valor !== "") || searchTerm.trim() !== ""
    setFiltrosActivos(hayFiltros)
  }, [filtros, searchTerm])

  const cargarTecnicosParaFiltro = async () => {
    try {
      const data = await averiasService.obtenerTecnicosParaFiltro()
      setTecnicosParaFiltro(data)
    } catch (error) {
      console.error("Error cargando técnicos para filtro:", error)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      estado: "",
      urgencia: "",
      id_tecnico_asignado: "",
      tipo_averia: "",
      fecha_desde: "",
      fecha_hasta: "",
    })
    setSearchTerm("") // También limpiar la búsqueda
  }

  const handleAveriaCreated = () => {
    cargarAverias() // Recargar la lista
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleAveriaClick = (averiaId) => {
    router.push(`/averias/${averiaId}`)
  }

  // Verificar si puede crear averías
  const canCreateAverias = ["oficina", "jefe_tecnico", "superusuario"].includes(userProfile?.rol)

  if (!canAccessAverias) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Acceso Denegado">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-600">No tienes permisos para acceder al módulo de averías.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title={userProfile?.rol === "tecnico" ? "Mis Averías" : "Gestión de Averías"}
        subtitle={userProfile?.rol === "tecnico" ? "Averías asignadas a ti" : "Listado completo de averías del sistema"}
      >
        {/* Header con búsqueda y acciones */}
        <div className="mb-6">
          {/* Barra de búsqueda y botón crear */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            {/* Barra de búsqueda y botón filtros */}
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar avería por código, tipo, contacto o ubicación"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Botón para mostrar/ocultar filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  showFilters || (filtrosActivos && !searchTerm)
                    ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
                {showFilters ? "🔽 Ocultar filtros" : "🎛️ Mostrar filtros"}
                {filtrosActivos && !showFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Activos
                  </span>
                )}
              </button>
            </div>

            {/* Botón crear avería */}
            {canCreateAverias && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear nueva avería
              </button>
            )}
          </div>

          {/* Panel de filtros desplegable */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                    />
                  </svg>
                  Filtros de búsqueda
                  {filtrosActivos && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Activos
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={limpiarFiltros}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Limpiar filtros
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    🔽 Ocultar filtros
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Filtro Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange("estado", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {averiasService.opcionesEstado.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Urgencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia</label>
                  <select
                    value={filtros.urgencia}
                    onChange={(e) => handleFiltroChange("urgencia", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todas las urgencias</option>
                    {averiasService.opcionesUrgencia.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Técnico - Solo para superusuario y oficina */}
                {["superusuario", "oficina"].includes(userProfile?.rol) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Técnico asignado</label>
                    <select
                      value={filtros.id_tecnico_asignado}
                      onChange={(e) => handleFiltroChange("id_tecnico_asignado", e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Todos los técnicos</option>
                      {tecnicosParaFiltro.map((tecnico) => (
                        <option key={tecnico.id_usuario} value={tecnico.id_usuario}>
                          {tecnico.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro Tipo de Avería */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de avería</label>
                  <select
                    value={filtros.tipo_averia}
                    onChange={(e) => handleFiltroChange("tipo_averia", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los tipos</option>
                    {averiasService.opcionesTipoAveria.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Fecha Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filtros.fecha_desde}
                    onChange={(e) => handleFiltroChange("fecha_desde", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Filtro Fecha Hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filtros.fecha_hasta}
                    onChange={(e) => handleFiltroChange("fecha_hasta", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Indicador de resultados */}
              {!loading && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {averias.length} {averias.length === 1 ? "avería encontrada" : "averías encontradas"}
                    {filtrosActivos && " (con filtros aplicados)"}
                  </div>
                  {filtrosActivos && (
                    <div className="flex items-center text-blue-600">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                        />
                      </svg>
                      Filtros activos
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white shadow rounded-lg">
          {/* Header de la sección */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">
                {userProfile?.rol === "tecnico" ? "Mis Averías Asignadas" : "Historial de Averías"}
              </h3>
            </div>
          </div>

          {/* Lista de averías */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              // Estado de carga
              <div className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando averías...</span>
                </div>
              </div>
            ) : error ? (
              // Estado de error
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={cargarAverias}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : averias.length === 0 ? (
              // Estado vacío
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filtrosActivos
                      ? "No se encontraron averías que coincidan con tu búsqueda"
                      : userProfile?.rol === "tecnico"
                        ? "No tienes averías asignadas"
                        : "No hay averías registradas"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filtrosActivos
                      ? "Intenta modificar los filtros o términos de búsqueda."
                      : userProfile?.rol === "tecnico"
                        ? "Cuando se te asignen averías, aparecerán aquí."
                        : "Comienza creando tu primera avería."}
                  </p>
                  {canCreateAverias && !searchTerm && !filtrosActivos && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear primera avería
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Lista de averías
              averias.map((averia) => (
                <div
                  key={averia.id_averia}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleAveriaClick(averia.id_averia)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {/* Ícono de alerta */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-orange-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Información principal */}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {averiasService.formatearCodigo(averia.id_averia)}
                            </h4>
                            <p className="text-sm text-gray-500">Número de intervención</p>
                          </div>
                        </div>
                      </div>

                      {/* Técnico asignado */}
                      <div className="ml-6 flex-shrink-0">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{averia.tecnico?.nombre || "Sin asignar"}</p>
                          <p className="text-gray-500">Técnico asignado</p>
                        </div>
                      </div>

                      {/* Ubicación */}
                      <div className="ml-6 flex-shrink-0">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{averia.equipos?.ubicacion || "Sin ubicación"}</p>
                          <p className="text-gray-500">Ubicación</p>
                        </div>
                      </div>

                      {/* Fecha */}
                      <div className="ml-6 flex-shrink-0">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {averiasService.formatearFecha(averia.fecha_creacion)}
                          </p>
                          <p className="text-gray-500">Última actualización</p>
                        </div>
                      </div>
                    </div>

                    {/* ID y Estado */}
                    <div className="ml-6 flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{averia.id_averia}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${averiasService.obtenerColorEstado(
                          averia.estado,
                        )}`}
                      >
                        {averia.estado}
                      </span>
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
      {/* Modal Nueva Avería */}
      <ModalNuevaAveria isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleAveriaCreated} />
    </ProtectedRoute>
  )
}

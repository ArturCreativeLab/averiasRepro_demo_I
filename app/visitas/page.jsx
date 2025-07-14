"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import { DashboardLayout } from "../../components/DashboardLayout"
import { visitasService } from "../../services/visitasService"
import { ModalNuevaVisita } from "../../components/ModalNuevaVisita"
import LoadingSpinner from "../../components/LoadingSpinner"
import Link from "next/link"

export default function VisitasPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const [visitas, setVisitas] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [aplicandoFiltros, setAplicandoFiltros] = useState(false)
  const [buscando, setBuscando] = useState(false)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    tecnico: "",
    estado: "",
    ubicacion: "",
    fechaDesde: "",
    fechaHasta: "",
  })

  useEffect(() => {
    if (userProfile && !authLoading) {
      cargarDatosIniciales()
    }
  }, [userProfile, authLoading])

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true)
      setError("")

      // Cargar visitas y técnicos en paralelo
      const [visitasData, tecnicosData] = await Promise.all([
        visitasService.listarVisitas(),
        visitasService.obtenerTecnicosDisponibles(),
      ])

      setVisitas(visitasData)
      setTecnicos(tecnicosData)
    } catch (error) {
      console.error("Error cargando datos iniciales:", error)
      setError("Error al cargar los datos. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = async () => {
    try {
      setAplicandoFiltros(true)
      setError("")

      const visitasFiltradas = await visitasService.listarVisitas(filtros, searchTerm)
      setVisitas(visitasFiltradas)
    } catch (error) {
      console.error("Error aplicando filtros:", error)
      setError("Error al aplicar los filtros. Intente nuevamente.")
    } finally {
      setAplicandoFiltros(false)
    }
  }

  const ejecutarBusqueda = async () => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, cargar todas las visitas con filtros actuales
      aplicarFiltros()
      return
    }

    try {
      setBuscando(true)
      setError("")

      const visitasEncontradas = await visitasService.listarVisitas(filtros, searchTerm)
      setVisitas(visitasEncontradas)
    } catch (error) {
      console.error("Error ejecutando búsqueda:", error)
      setError("Error al buscar visitas. Intente nuevamente.")
    } finally {
      setBuscando(false)
    }
  }

  const restablecerFiltros = async () => {
    setFiltros({
      tecnico: "",
      estado: "",
      ubicacion: "",
      fechaDesde: "",
      fechaHasta: "",
    })
    setSearchTerm("")

    try {
      setAplicandoFiltros(true)
      setError("")

      const todasLasVisitas = await visitasService.listarVisitas()
      setVisitas(todasLasVisitas)
    } catch (error) {
      console.error("Error restableciendo filtros:", error)
      setError("Error al restablecer los filtros. Intente nuevamente.")
    } finally {
      setAplicandoFiltros(false)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      ejecutarBusqueda()
    }
  }

  const handleSearchClick = () => {
    ejecutarBusqueda()
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      completada: "bg-green-100 text-green-800",
      programada: "bg-blue-100 text-blue-800",
      en_curso: "bg-yellow-100 text-yellow-800",
      cancelada: "bg-red-100 text-red-800",
      pendiente: "bg-gray-100 text-gray-800",
    }

    const labels = {
      completada: "Completada",
      programada: "Programada",
      en_curso: "En Curso",
      cancelada: "Cancelada",
      pendiente: "Pendiente",
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[estado] || badges.pendiente}`}
      >
        {labels[estado] || estado}
      </span>
    )
  }

  const handleVisitaCreated = () => {
    cargarDatosIniciales() // Recargar la lista después de crear una visita
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Gestión de Visitas" subtitle="Listado completo de visitas técnicas del sistema">
        {/* Barra de búsqueda y filtros */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  placeholder="Buscar visita por código, técnico, ubicación..."
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={handleSearchClick}
                    disabled={buscando}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:opacity-50"
                  >
                    {buscando ? (
                      <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón para mostrar/ocultar filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  showFilters
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
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              </button>
            </div>

            {/* Botón crear visita */}
            {(["oficina", "jefe_tecnico", "superusuario"].includes(userProfile?.rol) ||
              userProfile?.rol === "tecnico") && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear nueva visita
              </button>
            )}
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Filtro por técnico */}
                <div>
                  <label htmlFor="filtro-tecnico" className="block text-sm font-medium text-gray-700 mb-1">
                    Técnico responsable
                  </label>
                  <select
                    id="filtro-tecnico"
                    value={filtros.tecnico}
                    onChange={(e) => handleFiltroChange("tecnico", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos</option>
                    {tecnicos.map((tecnico) => (
                      <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por estado */}
                <div>
                  <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado de la visita
                  </label>
                  <select
                    id="filtro-estado"
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange("estado", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Programada">Programada</option>
                    <option value="En_curso">En Curso</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Filtro por ubicación */}
                <div>
                  <label htmlFor="filtro-ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    id="filtro-ubicacion"
                    placeholder="Buscar por ubicación"
                    value={filtros.ubicacion}
                    onChange={(e) => handleFiltroChange("ubicacion", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Filtro fecha desde */}
                <div>
                  <label htmlFor="filtro-fecha-desde" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    id="filtro-fecha-desde"
                    value={filtros.fechaDesde}
                    onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Filtro fecha hasta */}
                <div>
                  <label htmlFor="filtro-fecha-hasta" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    id="filtro-fecha-hasta"
                    value={filtros.fechaHasta}
                    onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={aplicarFiltros}
                  disabled={aplicandoFiltros}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aplicandoFiltros ? (
                    <div className="flex items-center">
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Aplicando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Aplicar filtros</span>
                    </div>
                  )}
                </button>

                <button
                  onClick={restablecerFiltros}
                  disabled={aplicandoFiltros}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Restablecer filtros</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="bg-white shadow rounded-lg">
          {/* Header de la sección */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Historial de Visitas</h3>
              <span className="ml-3 text-sm text-gray-500">
                ({visitas.length} {visitas.length === 1 ? "visita" : "visitas"})
              </span>
              {searchTerm && <span className="ml-2 text-sm text-blue-600">- Resultados para: "{searchTerm}"</span>}
            </div>
          </div>

          {/* Lista de visitas */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              // Estado de carga
              <div className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando visitas...</span>
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
                    onClick={cargarDatosIniciales}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : visitas.length === 0 ? (
              // Estado vacío
              <div className="p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || Object.values(filtros).some((f) => f !== "")
                      ? "No se encontraron visitas para el término buscado"
                      : "No hay visitas registradas aún"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || Object.values(filtros).some((f) => f !== "")
                      ? "Intenta modificar los filtros de búsqueda o el término buscado."
                      : "Comienza creando tu primera visita técnica."}
                  </p>
                  {(["oficina", "jefe_tecnico", "superusuario"].includes(userProfile?.rol) ||
                    userProfile?.rol === "tecnico") && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear primera visita
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Lista de visitas con datos reales
              visitas.map((visita) => (
                <Link key={visita.id_visita} href={`/visitas/${visita.id_visita}`}>
                  <div className="p-6 hover:bg-gray-100 transition-colors duration-150 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {/* Ícono de visita */}
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {visita.codigo || `VIS-${String(visita.id_visita).padStart(4, "0")}`}
                              </h4>
                              <p className="text-sm text-gray-500">Número de visita</p>
                            </div>
                          </div>
                        </div>

                        {/* Técnico asignado */}
                        <div className="ml-6 flex-shrink-0">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{visita.perfiles?.nombre || "Sin asignar"}</p>
                            <p className="text-gray-500">Técnico asignado</p>
                          </div>
                        </div>

                        {/* Ubicación */}
                        <div className="ml-6 flex-shrink-0">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {visita.averias?.maquinas?.ubicacion || "Sin ubicación"}
                            </p>
                            <p className="text-gray-500">Ubicación</p>
                          </div>
                        </div>

                        {/* Fecha */}
                        <div className="ml-6 flex-shrink-0">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {visitasService.formatearFecha(visita.fecha_visita || visita.fecha_programada)}
                            </p>
                            <p className="text-gray-500">Fecha de visita</p>
                          </div>
                        </div>

                        {/* Código de avería */}
                        <div className="ml-6 flex-shrink-0">
                          <div className="text-sm">
                            <p className="font-medium text-blue-600">
                              {visita.averias?.codigo || `AVR-${String(visita.id_averia).padStart(4, "0")}`}
                            </p>
                            <p className="text-gray-500">Avería asociada</p>
                          </div>
                        </div>
                      </div>

                      {/* ID y Estado */}
                      <div className="ml-6 flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{visita.id_visita}</p>
                        </div>
                        {getEstadoBadge(visita.estado)}
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Modal Nueva Visita */}
        <ModalNuevaVisita isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleVisitaCreated} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

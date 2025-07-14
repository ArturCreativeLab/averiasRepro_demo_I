"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "../../../context/AuthContext"
import { ProtectedRoute } from "../../../components/ProtectedRoute"
import { DashboardLayout } from "../../../components/DashboardLayout"
import { averiasService } from "../../../services/averiasService"
import { visitasService } from "../../../services/visitasService"
import { ModalAsignarTecnico } from "../../../components/ModalAsignarTecnico"
import { ModalNuevaVisita } from "../../../components/ModalNuevaVisita"
import Link from "next/link"

export default function DetalleAveriaPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const averiaId = params.id

  const [averia, setAveria] = useState(null)
  const [visitas, setVisitas] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAsignarTecnicoModal, setShowAsignarTecnicoModal] = useState(false)
  const [showModal, setShowModal] = useState(false) // Estados adicionales para modal de nueva visita

  // Estado del formulario
  const [formData, setFormData] = useState({})

  // Verificar permisos
  const canEdit = ["superusuario", "oficina"].includes(userProfile?.rol)
  const canDelete = userProfile?.rol === "superusuario"
  const isReadOnly = userProfile?.rol === "tecnico"

  // CORREGIDO: Verificar si puede editar técnico (superusuario o jefe_tecnico)
  const canEditTechnician = ["superusuario", "jefe_tecnico"].includes(userProfile?.rol)

  // Función para obtener el nombre del técnico asignado
  const getTecnicoAsignado = () => {
    if (!averia?.id_tecnico_asignado) {
      return "Sin asignar"
    }

    // Si hay relación con técnico, usar el nombre de la relación
    if (averia?.tecnico?.nombre) {
      return averia.tecnico.nombre
    }

    // Si no hay relación pero hay ID, mostrar el ID (fallback)
    return `Técnico ID: ${averia.id_tecnico_asignado}`
  }

  // Función para determinar el texto del botón
  const getButtonText = () => {
    if (!averia?.id_tecnico_asignado) {
      return "Asignar técnico"
    }
    return "Editar técnico asignado"
  }

  console.log("Debug técnico asignado:", {
    userRole: userProfile?.rol,
    averiaIdTecnico: averia?.id_tecnico_asignado,
    tecnicoRelacion: averia?.tecnico,
    canEditTechnician,
    tecnicoMostrado: getTecnicoAsignado(),
    averiaId,
  })

  useEffect(() => {
    if (averiaId && userProfile) {
      cargarDatos()
    }
  }, [averiaId, userProfile])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError("")

      // Cargar avería
      const averiaData = await averiasService.obtenerAveriaPorId(averiaId)
      console.log("Avería cargada:", averiaData)
      setAveria(averiaData)
      setFormData(averiaData)

      // Cargar visitas
      const visitasData = await visitasService.listarVisitasPorAveria(averiaId)
      setVisitas(visitasData)

      // Cargar técnicos si puede editar
      if (canEdit) {
        const tecnicosData = await averiasService.obtenerTecnicos()
        setTecnicos(tecnicosData)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
      setError("Error al cargar los datos de la avería")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (!canEdit) return

    try {
      setSaving(true)
      setError("")

      // Preparar payload según permisos
      let payload = {}

      if (userProfile.rol === "superusuario") {
        // Superusuario puede editar todo
        payload = { ...formData }
      } else if (userProfile.rol === "oficina") {
        // Oficina solo puede editar campos específicos
        payload = {
          estado: formData.estado,
          urgencia: formData.urgencia,
          email_contacto: formData.email_contacto,
          persona_contacto: formData.persona_contacto,
          horario_solicitado: formData.horario_solicitado,
          observaciones: formData.observaciones,
        }
      }

      await averiasService.actualizarAveria(averiaId, payload)
      await cargarDatos() // Recargar datos
    } catch (error) {
      console.error("Error guardando:", error)
      setError("Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return

    try {
      await averiasService.eliminarAveria(averiaId)
      router.push("/averias")
    } catch (error) {
      console.error("Error eliminando:", error)
      setError("Error al eliminar la avería")
    }
  }

  const handleNotify = () => {
    // Simulación de notificación
    alert("Notificación enviada (funcionalidad simulada)")
  }

  const handleTecnicoAsignado = () => {
    console.log("Técnico asignado/reasignado exitosamente, recargando datos...")
    cargarDatos() // Recargar datos para mostrar el técnico asignado
    setShowAsignarTecnicoModal(false)
  }

  const handleVisitaCreated = () => {
    cargarDatos() // Recargar datos para mostrar la nueva visita
  }

  const getFieldPermission = (field) => {
    if (isReadOnly) return true // Técnico: solo lectura

    if (userProfile.rol === "superusuario") return false // Superusuario: puede editar todo

    if (userProfile.rol === "oficina") {
      // Oficina: solo puede editar campos específicos
      const editableFields = [
        "estado",
        "urgencia",
        "email_contacto",
        "persona_contacto",
        "horario_solicitado",
        "observaciones",
      ]
      return !editableFields.includes(field)
    }

    return true // Por defecto, solo lectura
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Cargando...">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando detalle de avería...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error && !averia) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Error">
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
              onClick={() => router.push("/averias")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al listado
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title={`Detalle de Avería ${averiasService.formatearCodigo(averia?.id_averia)}`}
        subtitle={`${averia?.equipos?.ubicacion || "Sin ubicación"} - ${averia?.equipos?.modelo || "Sin modelo"}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Resumen */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información Principal */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Resumen</h3>
                <button
                  onClick={() => router.push("/averias")}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Volver
                </button>
              </div>

              <div className="space-y-4">
                {/* Código */}
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {averiasService.formatearCodigo(averia?.id_averia)}
                    </h4>
                    <p className="text-sm text-gray-500">Código de intervención</p>
                  </div>
                </div>

                {/* Ubicación */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Ubicación</span>
                    <span className="text-sm text-gray-900">{averia?.equipos?.ubicacion || "Sin especificar"}</span>
                  </div>
                </div>

                {/* Prioridad */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Prioridad</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      averia?.urgencia === 1
                        ? "bg-red-100 text-red-800"
                        : averia?.urgencia === 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {averia?.urgencia === 1 ? "Alta" : averia?.urgencia === 2 ? "Media" : "Baja"}
                  </span>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Estado</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${averiasService.obtenerColorEstado(
                      averia?.estado,
                    )}`}
                  >
                    {averia?.estado}
                  </span>
                </div>

                {/* Técnico - CORREGIDO */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Técnico asignado</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">{getTecnicoAsignado()}</span>
                    {canEditTechnician && (
                      <button
                        onClick={() => setShowAsignarTecnicoModal(true)}
                        className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title={
                          averia?.id_tecnico_asignado ? "Cambiar técnico asignado" : "Asignar técnico a esta avería"
                        }
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {averia?.id_tecnico_asignado ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          )}
                        </svg>
                        {getButtonText()}
                      </button>
                    )}
                  </div>
                </div>

                {/* Fecha creación */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Fecha creación</span>
                  <span className="text-sm text-gray-900">
                    {averiasService.formatearFechaHora(averia?.fecha_creacion)}
                  </span>
                </div>
              </div>
            </div>

            {/* Visitas Asociadas */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Visitas Asociadas</h3>
                {/* Botón crear visita para técnico asignado */}
                {userProfile?.rol === "tecnico" &&
                  averia?.id_tecnico_asignado &&
                  (() => {
                    // Verificar si el técnico actual es el asignado a la avería
                    const esTecnicoAsignado =
                      averia.tecnico?.id === userProfile.id || averia.usuarios?.auth_user_id === userProfile.id

                    return esTecnicoAsignado ? (
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva visita
                      </button>
                    ) : null
                  })()}
              </div>

              {visitas.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No hay visitas programadas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visitas.map((visita) => (
                    <Link key={visita.id_visita} href={`/visitas/${visita.id_visita}`}>
                      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{visita.codigo}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${visitasService.obtenerColorEstado(
                              visita.estado,
                            )}`}
                          >
                            {visita.estado}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {visita.tecnico.nombre}
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1"
                              />
                            </svg>
                            {visitasService.formatearFecha(visita.fecha_programada)}
                          </div>
                          {visita.observaciones && <p className="text-xs text-gray-500 mt-2">{visita.observaciones}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              {/* Header del formulario */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-orange-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">
                      {isReadOnly ? "Información de la Avería" : "Editar Avería"}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleNotify}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-5 5v-5m-6 0h6v-2H4v2zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z"
                        />
                      </svg>
                      Notificar
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido del formulario */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </div>
                )}

                {/* Datos Generales */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Datos Generales</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nº de intervención (ID)</label>
                      <input
                        type="text"
                        value={averiasService.formatearCodigo(averia?.id_averia)}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>

                    {/* Fecha creación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de creación</label>
                      <input
                        type="text"
                        value={averiasService.formatearFechaHora(averia?.fecha_creacion)}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la avería *</label>
                      <select
                        name="estado"
                        value={formData.estado || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("estado")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {averiasService.opcionesEstado.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Urgencia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grado de urgencia *</label>
                      <select
                        name="urgencia"
                        value={formData.urgencia || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("urgencia")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {averiasService.opcionesUrgencia.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Medio contacto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medio de notificación</label>
                      <select
                        name="medio_contacto"
                        value={formData.medio_contacto || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("medio_contacto")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {averiasService.opcionesMedioContacto.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Email contacto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto *</label>
                      <input
                        type="email"
                        name="email_contacto"
                        value={formData.email_contacto || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("email_contacto")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    {/* Persona contacto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto *</label>
                      <input
                        type="text"
                        name="persona_contacto"
                        value={formData.persona_contacto || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("persona_contacto")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    {/* Horario solicitado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario de reparación solicitado
                      </label>
                      <input
                        type="text"
                        name="horario_solicitado"
                        value={formData.horario_solicitado || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("horario_solicitado")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    {/* Técnico asignado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Técnico asignado</label>
                      <select
                        name="id_tecnico_asignado"
                        value={formData.id_tecnico_asignado || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("id_tecnico_asignado")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Sin asignar</option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.id_usuario} value={tecnico.id_usuario}>
                            {tecnico.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información del Equipo */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Equipo</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nº Interno</label>
                      <input
                        type="text"
                        value={averia?.equipos?.numero_interno || ""}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                      <input
                        type="text"
                        value={averia?.equipos?.numero_serie || "Sin especificar"}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                      <input
                        type="text"
                        value={averia?.equipos?.modelo || ""}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                      <input
                        type="text"
                        value={averia?.equipos?.ubicacion || ""}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                      <input
                        type="text"
                        value={averia?.equipos?.marca || "Sin especificar"}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Estado Técnico */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Estado Técnico</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Estado máquina */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la máquina</label>
                      <select
                        name="estado_maquina"
                        value={formData.estado_maquina || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("estado_maquina")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {averiasService.opcionesEstadoMaquina.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo avería */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de avería</label>
                      <select
                        name="tipo_averia"
                        value={formData.tipo_averia || ""}
                        onChange={handleInputChange}
                        disabled={getFieldPermission("tipo_averia")}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {averiasService.opcionesTipoAveria.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones generales</label>
                    <textarea
                      name="observaciones"
                      value={formData.observaciones || ""}
                      onChange={handleInputChange}
                      disabled={getFieldPermission("observaciones")}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              {canEdit && (
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Eliminar avería</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          ¿Estás seguro de que quieres eliminar la avería{" "}
                          <strong>{averiasService.formatearCodigo(averia?.id_averia)}</strong>? Esta acción no se puede
                          deshacer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleDelete}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Asignar/Reasignar Técnico - CORREGIDO */}
        <ModalAsignarTecnico
          isOpen={showAsignarTecnicoModal}
          onClose={() => setShowAsignarTecnicoModal(false)}
          onSuccess={handleTecnicoAsignado}
          averiaId={averiaId}
          averiaCodigo={averiasService.formatearCodigo(averia?.id_averia)}
          tecnicoActual={averia?.tecnico} // Pasar técnico actual para reasignación
        />
        {/* Modal Nueva Visita para técnicos */}
        {userProfile?.rol === "tecnico" && (
          <ModalNuevaVisita isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleVisitaCreated} />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

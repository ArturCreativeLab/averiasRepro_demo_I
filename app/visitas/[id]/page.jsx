"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "../../../context/AuthContext"
import { ProtectedRoute } from "../../../components/ProtectedRoute"
import { DashboardLayout } from "../../../components/DashboardLayout"
import { visitasService } from "../../../services/visitasService"
import LoadingSpinner from "../../../components/LoadingSpinner"

export default function VisitaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile, loading: authLoading } = useAuth()
  const [visita, setVisita] = useState(null)
  const [tecnicos, setTecnicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_tecnico: "",
    fecha_visita: "",
    estado: "",
    contador_color: "",
    contador_bn: "",
    contador_escaner: "",
    descripcion_solucion: "",
    solucion_aplicada: "",
    estado_final_maquina: "",
    pieza_1: "",
    estado_pieza_1: "",
    pieza_2: "",
    estado_pieza_2: "",
    pieza_3: "",
    estado_pieza_3: "",
    fecha_inicio: "",
    fecha_fin: "",
    observaciones: "",
    mantenimiento: {
      limpieza_general: false,
      calibracion: false,
      revision_mecanica: false,
      actualizacion_firmware: false,
    },
  })

  useEffect(() => {
    if (userProfile && !authLoading && params.id) {
      cargarDatosVisita()
    }
  }, [userProfile, authLoading, params.id])

  const cargarDatosVisita = async () => {
    try {
      setLoading(true)
      setError("")

      const [visitaData, tecnicosData] = await Promise.all([
        visitasService.obtenerVisitaPorId(params.id),
        visitasService.obtenerTecnicosDisponibles(),
      ])

      setVisita(visitaData)
      setTecnicos(tecnicosData)

      // Llenar el formulario con los datos de la visita
      const mantenimientoCheckboxes = visitasService.parsearMantenimiento(visitaData.mantenimiento)

      setFormData({
        id_tecnico: visitaData.id_tecnico || "",
        fecha_visita: visitasService.formatearFechaParaInputDate(visitaData.fecha_visita),
        estado: visitaData.estado || "",
        contador_color: visitaData.contador_color || "",
        contador_bn: visitaData.contador_bn || "",
        contador_escaner: visitaData.contador_escaner || "",
        descripcion_solucion: visitaData.descripcion_solucion || "",
        solucion_aplicada: visitaData.solucion_aplicada || "",
        estado_final_maquina: visitaData.estado_final_maquina || "",
        pieza_1: visitaData.pieza_1 || "",
        estado_pieza_1: visitaData.estado_pieza_1 || "",
        pieza_2: visitaData.pieza_2 || "",
        estado_pieza_2: visitaData.estado_pieza_2 || "",
        pieza_3: visitaData.pieza_3 || "",
        estado_pieza_3: visitaData.estado_pieza_3 || "",
        fecha_inicio: visitasService.formatearFechaParaInput(visitaData.fecha_inicio),
        fecha_fin: visitasService.formatearFechaParaInput(visitaData.fecha_fin),
        observaciones: visitaData.observaciones || "",
        mantenimiento: mantenimientoCheckboxes,
      })
    } catch (error) {
      console.error("Error cargando datos de la visita:", error)
      setError("Error al cargar los datos de la visita. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleMantenimientoChange = (field, checked) => {
    setFormData((prev) => ({
      ...prev,
      mantenimiento: {
        ...prev.mantenimiento,
        [field]: checked,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")
      setSuccessMessage("")

      // Construir el array de mantenimiento
      const mantenimientoArray = visitasService.construirArrayMantenimiento(formData.mantenimiento)

      // Preparar datos para actualización
      const datosActualizados = {
        id_tecnico: formData.id_tecnico,
        fecha_visita: formData.fecha_visita,
        estado: formData.estado,
        contador_color: formData.contador_color ? Number.parseInt(formData.contador_color) : null,
        contador_bn: formData.contador_bn ? Number.parseInt(formData.contador_bn) : null,
        contador_escaner: formData.contador_escaner ? Number.parseInt(formData.contador_escaner) : null,
        descripcion_solucion: formData.descripcion_solucion,
        solucion_aplicada: formData.solucion_aplicada,
        estado_final_maquina: formData.estado_final_maquina,
        pieza_1: formData.pieza_1,
        estado_pieza_1: formData.estado_pieza_1,
        pieza_2: formData.pieza_2,
        estado_pieza_2: formData.estado_pieza_2,
        pieza_3: formData.pieza_3,
        estado_pieza_3: formData.estado_pieza_3,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        observaciones: formData.observaciones,
        mantenimiento: mantenimientoArray,
      }

      await visitasService.actualizarVisita(params.id, datosActualizados, userProfile.id)

      setSuccessMessage("Visita actualizada correctamente")

      // Recargar los datos para mostrar los cambios
      setTimeout(() => {
        cargarDatosVisita()
        setSuccessMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error actualizando visita:", error)
      setError("Error al actualizar la visita. Intente nuevamente.")
    } finally {
      setSaving(false)
    }
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

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (error && !visita) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Error" subtitle="No se pudo cargar la visita">
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
              onClick={() => router.push("/visitas")}
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
        title={`Visita ${visita?.codigo || `VIS-${String(params.id).padStart(4, "0")}`}`}
        subtitle="Detalles y edición de la visita técnica"
      >
        {/* Header con información básica */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
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
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {visita?.codigo || `VIS-${String(params.id).padStart(4, "0")}`}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {params.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getEstadoBadge(visita?.estado)}
                <button
                  onClick={() => router.push("/visitas")}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Volver al listado
                </button>
              </div>
            </div>
          </div>

          {/* Información de la avería asociada */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Avería asociada</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {visita?.averias?.codigo || `AVR-${String(visita?.id_averia).padStart(4, "0")}`}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Ubicación</h4>
                <p className="mt-1 text-sm text-gray-900">{visita?.averias?.maquinas?.ubicacion || "Sin ubicación"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Modelo de máquina</h4>
                <p className="mt-1 text-sm text-gray-900">{visita?.averias?.maquinas?.modelo || "Sin modelo"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de edición */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información básica</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tecnico" className="block text-sm font-medium text-gray-700">
                    Técnico asignado
                  </label>
                  <select
                    id="tecnico"
                    value={formData.id_tecnico}
                    onChange={(e) => handleInputChange("id_tecnico", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar técnico</option>
                    {tecnicos.map((tecnico) => (
                      <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fecha_visita" className="block text-sm font-medium text-gray-700">
                    Fecha de visita
                  </label>
                  <input
                    type="date"
                    id="fecha_visita"
                    value={formData.fecha_visita}
                    onChange={(e) => handleInputChange("fecha_visita", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange("estado", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="programada">Programada</option>
                    <option value="en_curso">En Curso</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estado_final_maquina" className="block text-sm font-medium text-gray-700">
                    Estado final de la máquina
                  </label>
                  <select
                    id="estado_final_maquina"
                    value={formData.estado_final_maquina}
                    onChange={(e) => handleInputChange("estado_final_maquina", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="operativa">Operativa</option>
                    <option value="no_operativa">No operativa</option>
                    <option value="en_reparacion">En reparación</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contadores */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Contadores</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="contador_color" className="block text-sm font-medium text-gray-700">
                    Contador color
                  </label>
                  <input
                    type="number"
                    id="contador_color"
                    value={formData.contador_color}
                    onChange={(e) => handleInputChange("contador_color", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contador_bn" className="block text-sm font-medium text-gray-700">
                    Contador B/N
                  </label>
                  <input
                    type="number"
                    id="contador_bn"
                    value={formData.contador_bn}
                    onChange={(e) => handleInputChange("contador_bn", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contador_escaner" className="block text-sm font-medium text-gray-700">
                    Contador escáner
                  </label>
                  <input
                    type="number"
                    id="contador_escaner"
                    value={formData.contador_escaner}
                    onChange={(e) => handleInputChange("contador_escaner", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Piezas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Piezas</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                {/* Pieza 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pieza_1" className="block text-sm font-medium text-gray-700">
                      Pieza 1
                    </label>
                    <input
                      type="text"
                      id="pieza_1"
                      value={formData.pieza_1}
                      onChange={(e) => handleInputChange("pieza_1", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado_pieza_1" className="block text-sm font-medium text-gray-700">
                      Estado pieza 1
                    </label>
                    <select
                      id="estado_pieza_1"
                      value={formData.estado_pieza_1}
                      onChange={(e) => handleInputChange("estado_pieza_1", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="nueva">Nueva</option>
                      <option value="reparada">Reparada</option>
                      <option value="sustituida">Sustituida</option>
                    </select>
                  </div>
                </div>

                {/* Pieza 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pieza_2" className="block text-sm font-medium text-gray-700">
                      Pieza 2
                    </label>
                    <input
                      type="text"
                      id="pieza_2"
                      value={formData.pieza_2}
                      onChange={(e) => handleInputChange("pieza_2", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado_pieza_2" className="block text-sm font-medium text-gray-700">
                      Estado pieza 2
                    </label>
                    <select
                      id="estado_pieza_2"
                      value={formData.estado_pieza_2}
                      onChange={(e) => handleInputChange("estado_pieza_2", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="nueva">Nueva</option>
                      <option value="reparada">Reparada</option>
                      <option value="sustituida">Sustituida</option>
                    </select>
                  </div>
                </div>

                {/* Pieza 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pieza_3" className="block text-sm font-medium text-gray-700">
                      Pieza 3
                    </label>
                    <input
                      type="text"
                      id="pieza_3"
                      value={formData.pieza_3}
                      onChange={(e) => handleInputChange("pieza_3", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado_pieza_3" className="block text-sm font-medium text-gray-700">
                      Estado pieza 3
                    </label>
                    <select
                      id="estado_pieza_3"
                      value={formData.estado_pieza_3}
                      onChange={(e) => handleInputChange("estado_pieza_3", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="nueva">Nueva</option>
                      <option value="reparada">Reparada</option>
                      <option value="sustituida">Sustituida</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mantenimiento */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mantenimiento realizado</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="limpieza_general"
                    type="checkbox"
                    checked={formData.mantenimiento.limpieza_general}
                    onChange={(e) => handleMantenimientoChange("limpieza_general", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="limpieza_general" className="ml-2 block text-sm text-gray-900">
                    Limpieza general
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="calibracion"
                    type="checkbox"
                    checked={formData.mantenimiento.calibracion}
                    onChange={(e) => handleMantenimientoChange("calibracion", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="calibracion" className="ml-2 block text-sm text-gray-900">
                    Calibración
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="revision_mecanica"
                    type="checkbox"
                    checked={formData.mantenimiento.revision_mecanica}
                    onChange={(e) => handleMantenimientoChange("revision_mecanica", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="revision_mecanica" className="ml-2 block text-sm text-gray-900">
                    Revisión mecánica
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="actualizacion_firmware"
                    type="checkbox"
                    checked={formData.mantenimiento.actualizacion_firmware}
                    onChange={(e) => handleMantenimientoChange("actualizacion_firmware", e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="actualizacion_firmware" className="ml-2 block text-sm text-gray-900">
                    Actualización firmware
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Soluciones */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Soluciones</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                <div>
                  <label htmlFor="descripcion_solucion" className="block text-sm font-medium text-gray-700">
                    Descripción de la solución
                  </label>
                  <textarea
                    id="descripcion_solucion"
                    rows={4}
                    value={formData.descripcion_solucion}
                    onChange={(e) => handleInputChange("descripcion_solucion", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe la solución aplicada..."
                  />
                </div>

                <div>
                  <label htmlFor="solucion_aplicada" className="block text-sm font-medium text-gray-700">
                    Solución aplicada
                  </label>
                  <textarea
                    id="solucion_aplicada"
                    rows={4}
                    value={formData.solucion_aplicada}
                    onChange={(e) => handleInputChange("solucion_aplicada", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detalla la solución específica aplicada..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fechas y observaciones */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Fechas y observaciones</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">
                      Fecha y hora de inicio
                    </label>
                    <input
                      type="datetime-local"
                      id="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={(e) => handleInputChange("fecha_inicio", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700">
                      Fecha y hora de fin
                    </label>
                    <input
                      type="datetime-local"
                      id="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={(e) => handleInputChange("fecha_fin", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange("observaciones", e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push("/visitas")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

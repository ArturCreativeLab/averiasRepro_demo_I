"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { averiasService } from "../services/averiasService"

export const ModalNuevaAveria = ({ isOpen, onClose, onSuccess }) => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [maquinas, setMaquinas] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [searchMaquina, setSearchMaquina] = useState("")
  const [loadingMaquinas, setLoadingMaquinas] = useState(false)

  const [formData, setFormData] = useState({
    estado: "abierta",
    urgencia: 2,
    medio_contacto: "correo",
    email_contacto: "",
    persona_contacto: "",
    horario_solicitado: "",
    id_maquina: "",
    estado_maquina: "funcionando",
    tipo_averia: "hardware",
    observaciones: "",
    id_tecnico_asignado: "", // Campo opcional
  })

  useEffect(() => {
    if (isOpen) {
      cargarTecnicos()
      buscarMaquinas("")
      // Reset form
      setFormData({
        estado: "abierta",
        urgencia: 2,
        medio_contacto: "correo",
        email_contacto: "",
        persona_contacto: "",
        horario_solicitado: "",
        id_maquina: "",
        estado_maquina: "funcionando",
        tipo_averia: "hardware",
        observaciones: "",
        id_tecnico_asignado: "",
      })
      setError("")
      setSearchMaquina("")
    }
  }, [isOpen])

  const cargarTecnicos = async () => {
    try {
      const data = await averiasService.obtenerTecnicos()
      setTecnicos(data)
    } catch (error) {
      console.error("Error cargando técnicos:", error)
    }
  }

  const buscarMaquinas = async (searchTerm) => {
    try {
      setLoadingMaquinas(true)
      const data = await averiasService.obtenerMaquinas(searchTerm)
      setMaquinas(data)
    } catch (error) {
      console.error("Error buscando máquinas:", error)
    } finally {
      setLoadingMaquinas(false)
    }
  }

  const handleSearchMaquina = (e) => {
    const value = e.target.value
    setSearchMaquina(value)

    // Debounce search
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      buscarMaquinas(value)
    }, 300)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const errors = []

    if (!formData.email_contacto.trim()) {
      errors.push("El email de contacto es obligatorio")
    }

    if (!formData.persona_contacto.trim()) {
      errors.push("La persona de contacto es obligatoria")
    }

    if (!formData.id_maquina) {
      errors.push("Debe seleccionar una máquina")
    }

    // Nota: id_tecnico_asignado ya NO es obligatorio

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(", "))
      return
    }

    try {
      setLoading(true)
      setError("")

      // Preparar datos para envío
      const averiaData = {
        ...formData,
        urgencia: Number.parseInt(formData.urgencia),
        // Si no hay técnico seleccionado, enviar null
        id_tecnico_asignado: formData.id_tecnico_asignado || null,
      }

      console.log("Creando avería:", averiaData)

      await averiasService.crearAveria(averiaData, userProfile.id_usuario)

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creando avería:", error)
      setError("Error al crear la avería. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      estado: "abierta",
      urgencia: 2,
      medio_contacto: "correo",
      email_contacto: "",
      persona_contacto: "",
      horario_solicitado: "",
      id_maquina: "",
      estado_maquina: "funcionando",
      tipo_averia: "hardware",
      observaciones: "",
      id_tecnico_asignado: "",
    })
    setError("")
    setSearchMaquina("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
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
                <h3 className="ml-3 text-lg font-medium text-gray-900">Nueva Avería</h3>
              </div>
              <button
                onClick={handleClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Error Message */}
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
                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la avería *</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                      value={formData.urgencia}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                      value={formData.medio_contacto}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                      value={formData.email_contacto}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Persona contacto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Persona de contacto *</label>
                    <input
                      type="text"
                      name="persona_contacto"
                      value={formData.persona_contacto}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                      value={formData.horario_solicitado}
                      onChange={handleInputChange}
                      placeholder="Ej: Mañanas, 9:00-12:00"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Técnico asignado - AHORA OPCIONAL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Técnico asignado</label>
                    <select
                      name="id_tecnico_asignado"
                      value={formData.id_tecnico_asignado}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Sin asignar (se asignará más tarde)</option>
                      {tecnicos.map((tecnico) => (
                        <option key={tecnico.id_usuario} value={tecnico.id_usuario}>
                          {tecnico.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      💡 El técnico puede asignarse más tarde por el jefe técnico
                    </p>
                  </div>
                </div>
              </div>

              {/* Selección de Máquina */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Selección de Máquina</h4>

                {/* Buscador de máquinas */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar máquina</label>
                  <input
                    type="text"
                    value={searchMaquina}
                    onChange={handleSearchMaquina}
                    placeholder="Buscar por número interno, modelo, ubicación..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Lista de máquinas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar máquina *</label>
                  {loadingMaquinas ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="ml-3 text-gray-600">Buscando máquinas...</span>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                      {maquinas.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No se encontraron máquinas. Intente con otros términos de búsqueda.
                        </div>
                      ) : (
                        maquinas.map((maquina) => (
                          <label
                            key={maquina.id_maquina}
                            className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                              formData.id_maquina === maquina.id_maquina ? "bg-orange-50 border-orange-200" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="id_maquina"
                              value={maquina.id_maquina}
                              checked={formData.id_maquina === maquina.id_maquina}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {maquina.numero_interno} - {maquina.modelo}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {maquina.ubicacion} | {maquina.marca}
                                  </p>
                                  {maquina.numero_serie && (
                                    <p className="text-xs text-gray-400">Serie: {maquina.numero_serie}</p>
                                  )}
                                </div>
                                {formData.id_maquina === maquina.id_maquina && (
                                  <div className="flex-shrink-0">
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
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}
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
                      value={formData.estado_maquina}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                      value={formData.tipo_averia}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describa el problema, síntomas observados, etc."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Crear avería
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { visitasService } from "../services/visitasService"

export const ModalNuevaVisita = ({ isOpen, onClose, onSuccess }) => {
  const { user, userProfile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loadingData, setLoadingData] = useState(false)
  const [modalReady, setModalReady] = useState(false)

  // Estados para datos dinámicos
  const [averiasDisponibles, setAveriasDisponibles] = useState([])
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState([])
  const [averiaSeleccionada, setAveriaSeleccionada] = useState(null)
  const [showTecnicoWarning, setShowTecnicoWarning] = useState(false)

  const [formData, setFormData] = useState({
    // Datos Básicos
    id_averia: "",
    id_tecnico: "",
    fecha_visita: "",
    estado: "pendiente",

    // Contadores
    contador_color: 0,
    contador_bn: 0,
    contador_escaner: 0,

    // Solución Técnica
    descripcion_solucion: "",

    // Cambio de Piezas (máximo 3)
    piezas: [
      { pieza: "", estado_pieza: "nueva" },
      { pieza: "", estado_pieza: "nueva" },
      { pieza: "", estado_pieza: "nueva" },
    ],

    // Mantenimiento realizado
    mantenimiento: {
      limpieza_general: false,
      calibracion: false,
      revision_mecanica: false,
      actualizacion_firmware: false,
      otros: false,
    },

    // Fechas y Estado Final
    fecha_inicio: "",
    fecha_fin: "",
    estado_final_maquina: "funcionando",
    observaciones_tecnico: "",
  })

  // Efecto para manejar la apertura del modal
  useEffect(() => {
    if (isOpen) {
      console.log("Modal abierto. Estado de auth:", {
        authLoading,
        user: !!user,
        userProfile: !!userProfile,
        userProfileId: userProfile?.id,
        userProfileComplete: userProfile,
      })

      // Si la autenticación aún está cargando, esperar
      if (authLoading) {
        console.log("Esperando a que termine la carga de autenticación...")
        setModalReady(false)
        return
      }

      // Si no hay usuario autenticado, cerrar modal
      if (!user) {
        console.error("No hay usuario autenticado")
        setError("Debe iniciar sesión para crear visitas")
        return
      }

      // Si no hay perfil de usuario, mostrar error específico
      if (!userProfile) {
        console.error("Perfil de usuario no disponible")
        setError("Error cargando perfil de usuario. Intente cerrar sesión e iniciar sesión nuevamente.")
        setModalReady(false)
        return
      }

      // Verificar que el perfil tenga ID
      if (!userProfile.id) {
        console.error("Perfil de usuario sin ID:", userProfile)
        setError("Error: Perfil de usuario incompleto. Intente cerrar sesión e iniciar sesión nuevamente.")
        setModalReady(false)
        return
      }

      // Todo está listo, cargar datos
      console.log("Modal listo para cargar datos con perfil:", userProfile.id)
      setModalReady(true)
      cargarDatosIniciales()
    } else {
      // Modal cerrado, resetear estados
      setModalReady(false)
      setError("")
    }
  }, [isOpen, authLoading, user, userProfile])

  const cargarDatosIniciales = async () => {
    // Verificación adicional de seguridad
    if (!userProfile || !userProfile.id) {
      console.warn("Perfil no disponible o sin ID en cargarDatosIniciales:", userProfile)
      setError("Perfil de usuario no disponible o incompleto")
      return
    }

    try {
      setLoadingData(true)
      setError("")

      console.log("Cargando datos iniciales para perfil:", {
        id: userProfile.id,
        rol: userProfile.rol,
        nombre: userProfile.nombre,
      })

      // Cargar averías y técnicos en paralelo
      let averiasPromise

      if (userProfile.rol === "tecnico") {
        // Para técnicos, solo mostrar averías asignadas a él usando su UUID de perfil
        console.log("Cargando averías para técnico con ID:", userProfile.id)
        averiasPromise = visitasService.obtenerAveriasDisponiblesPorTecnico(userProfile.id)
      } else {
        // Para otros roles, mostrar todas las averías disponibles
        console.log("Cargando todas las averías disponibles para rol:", userProfile.rol)
        averiasPromise = visitasService.obtenerAveriasDisponibles()
      }

      const [averias, tecnicos] = await Promise.all([averiasPromise, visitasService.obtenerTecnicosDisponibles()])

      console.log("Datos cargados exitosamente:", {
        averias: averias.length,
        tecnicos: tecnicos.length,
        perfilTecnico: userProfile.rol === "tecnico" ? userProfile.id : "N/A",
        listaAverias: averias,
      })

      setAveriasDisponibles(averias)
      setTecnicosDisponibles(tecnicos)
    } catch (error) {
      console.error("Error cargando datos iniciales:", error)
      setError("Error al cargar los datos. Intente nuevamente.")
    } finally {
      setLoadingData(false)
    }
  }

  const handleAveriaChange = async (e) => {
    const averiaId = e.target.value
    setFormData((prev) => ({ ...prev, id_averia: averiaId }))

    if (averiaId) {
      // Buscar la avería seleccionada
      const averia = averiasDisponibles.find((a) => a.id_averia.toString() === averiaId)
      setAveriaSeleccionada(averia)

      if (averia) {
        console.log("Avería seleccionada:", averia)

        if (averia.id_tecnico_asignado && averia.usuarios) {
          console.log("Avería tiene técnico asignado:", averia.usuarios)

          // Usar el auth_user_id del técnico asignado (UUID del perfil)
          const tecnicoUUID = averia.usuarios.auth_user_id

          if (tecnicoUUID) {
            console.log("Autocompletando técnico con UUID:", tecnicoUUID)
            setFormData((prev) => ({
              ...prev,
              id_tecnico: tecnicoUUID,
            }))
            setShowTecnicoWarning(false)
          } else {
            console.warn("No se encontró auth_user_id para el técnico asignado")
            setFormData((prev) => ({ ...prev, id_tecnico: "" }))
            setShowTecnicoWarning(true)
          }
        } else {
          // No hay técnico asignado
          console.log("Avería sin técnico asignado")
          setFormData((prev) => ({ ...prev, id_tecnico: "" }))

          if (userProfile?.rol !== "superusuario") {
            // Mostrar warning para usuarios no superusuario
            setShowTecnicoWarning(true)
            console.log("Mostrando warning: avería sin técnico asignado")
          } else {
            // Superusuario puede continuar sin restricciones
            setShowTecnicoWarning(false)
            console.log("Superusuario: puede continuar sin técnico asignado")
          }
        }
      }
    } else {
      // No hay avería seleccionada
      setAveriaSeleccionada(null)
      setFormData((prev) => ({ ...prev, id_tecnico: "" }))
      setShowTecnicoWarning(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.startsWith("mantenimiento.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        mantenimiento: {
          ...prev.mantenimiento,
          [field]: checked,
        },
      }))
    } else if (name.startsWith("pieza_")) {
      const [, index, field] = name.split("_")
      const piezaIndex = Number.parseInt(index)
      setFormData((prev) => ({
        ...prev,
        piezas: prev.piezas.map((pieza, i) => (i === piezaIndex ? { ...pieza, [field]: value } : pieza)),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))
    }
  }

  const validateForm = () => {
    const errors = []

    if (!formData.id_averia) {
      errors.push("Debe seleccionar una avería")
    }

    if (!formData.id_tecnico) {
      // Solo es error si no es superusuario
      if (userProfile?.rol !== "superusuario") {
        errors.push("Debe seleccionar un técnico")
      }
    }

    if (!formData.fecha_visita) {
      errors.push("Debe especificar la fecha de visita")
    }

    return errors
  }

  const handleClose = () => {
    // Reset form
    setFormData({
      id_averia: "",
      id_tecnico: "",
      fecha_visita: "",
      estado: "pendiente",
      contador_color: 0,
      contador_bn: 0,
      contador_escaner: 0,
      descripcion_solucion: "",
      piezas: [
        { pieza: "", estado_pieza: "nueva" },
        { pieza: "", estado_pieza: "nueva" },
        { pieza: "", estado_pieza: "nueva" },
      ],
      mantenimiento: {
        limpieza_general: false,
        calibracion: false,
        revision_mecanica: false,
        actualizacion_firmware: false,
        otros: false,
      },
      fecha_inicio: "",
      fecha_fin: "",
      estado_final_maquina: "funcionando",
      observaciones_tecnico: "",
    })
    setError("")
    setLoading(false)
    setLoadingData(false)
    setAveriaSeleccionada(null)
    setShowTecnicoWarning(false)
    setAveriasDisponibles([])
    setTecnicosDisponibles([])
    setModalReady(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar formulario
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(", "))
      return
    }

    try {
      setLoading(true)
      setError("")

      console.log("Enviando datos de visita:", formData)
      console.log("Creado por (perfil UUID):", userProfile?.id)

      // Construir array de mantenimiento correctamente
      const mantenimientoArray = []
      if (formData.mantenimiento.limpieza_general) mantenimientoArray.push("Limpieza general")
      if (formData.mantenimiento.calibracion) mantenimientoArray.push("Calibración")
      if (formData.mantenimiento.revision_mecanica) mantenimientoArray.push("Revisión mecánica")
      if (formData.mantenimiento.actualizacion_firmware) mantenimientoArray.push("Actualización firmware")
      if (formData.mantenimiento.otros) mantenimientoArray.push("Otros")

      // Construir datos de piezas correctamente
      const piezasData = {}
      formData.piezas.forEach((pieza, index) => {
        if (pieza.pieza && pieza.pieza.trim() !== "") {
          piezasData[`pieza_${index + 1}`] = pieza.pieza.trim()
          piezasData[`estado_pieza_${index + 1}`] = pieza.estado_pieza
        }
      })

      const datosVisita = {
        ...formData,
        mantenimiento: mantenimientoArray,
        ...piezasData,
      }

      // Crear la visita usando el UUID del perfil como creado_por
      await visitasService.crearVisita(datosVisita, userProfile?.id)

      // Éxito: cerrar modal y refrescar lista
      if (onSuccess) {
        onSuccess()
      }
      handleClose()
    } catch (error) {
      console.error("Error creando visita:", error)
      setError("Error al crear la visita. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatearOpcionAveria = (averia) => {
    const codigo = visitasService.formatearCodigoAveria(averia.id_averia)
    const ubicacion = averia.maquinas?.ubicacion || "Sin ubicación"
    const fecha = visitasService.formatearFecha(averia.fecha_creacion)
    return `${codigo} – ${ubicacion} – ${fecha}`
  }

  // No mostrar el modal si no está abierto
  if (!isOpen) return null

  // Mostrar loading si la autenticación está cargando
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="bg-white px-6 py-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Verificando autenticación...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si no hay usuario o perfil
  if (!user || !userProfile || !userProfile.id) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="bg-white px-6 py-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error de autenticación</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {!user
                      ? "Debe iniciar sesión para crear visitas"
                      : !userProfile
                        ? "Error cargando perfil de usuario"
                        : "Perfil de usuario incompleto"}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleClose}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
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
                <h3 className="ml-3 text-lg font-medium text-gray-900">Nueva Visita</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={loading || loadingData}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-4 max-h-[75vh] overflow-y-auto">
              {/* Loading inicial */}
              {loadingData && (
                <div className="mb-6 flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Cargando datos...</span>
                </div>
              )}

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

              {/* Warning de técnico no asignado */}
              {showTecnicoWarning && (
                <div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Debe solicitar asignación</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Esta avería aún no tiene técnico asignado. Solicite al jefe técnico su asignación.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos Básicos */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Datos Básicos</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Avería asociada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avería asociada *</label>
                    <select
                      name="id_averia"
                      value={formData.id_averia}
                      onChange={handleAveriaChange}
                      required
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar avería...</option>
                      {averiasDisponibles.map((averia) => (
                        <option key={averia.id_averia} value={averia.id_averia}>
                          {formatearOpcionAveria(averia)}
                        </option>
                      ))}
                    </select>
                    {averiasDisponibles.length === 0 && !loadingData && (
                      <p className="mt-1 text-xs text-gray-500">
                        {userProfile?.rol === "tecnico"
                          ? "No hay averías asignadas a usted"
                          : "No hay averías abiertas disponibles"}
                      </p>
                    )}
                  </div>

                  {/* Técnico */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Técnico asignado *
                      {averiaSeleccionada?.id_tecnico_asignado && (
                        <span className="ml-1 text-xs text-green-600">(Auto-completado)</span>
                      )}
                    </label>
                    <select
                      name="id_tecnico"
                      value={formData.id_tecnico}
                      onChange={handleInputChange}
                      required
                      disabled={
                        loading ||
                        loadingData ||
                        (averiaSeleccionada?.id_tecnico_asignado && userProfile?.rol !== "superusuario")
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar técnico</option>
                      {tecnicosDisponibles.map((tecnico) => (
                        <option key={tecnico.id} value={tecnico.id}>
                          {tecnico.nombre}
                        </option>
                      ))}
                    </select>
                    {averiaSeleccionada?.id_tecnico_asignado && averiaSeleccionada?.usuarios && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Técnico asignado a la avería: {averiaSeleccionada.usuarios.nombre}
                      </p>
                    )}
                  </div>

                  {/* Fecha de visita */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de visita *</label>
                    <input
                      type="date"
                      name="fecha_visita"
                      value={formData.fecha_visita}
                      onChange={handleInputChange}
                      required
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Estado de visita */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de visita</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="completada">Completada</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contadores */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contadores</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="number"
                      name="contador_color"
                      value={formData.contador_color}
                      onChange={handleInputChange}
                      min="0"
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Blanco y negro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blanco y negro</label>
                    <input
                      type="number"
                      name="contador_bn"
                      value={formData.contador_bn}
                      onChange={handleInputChange}
                      min="0"
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Escáner */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escáner</label>
                    <input
                      type="number"
                      name="contador_escaner"
                      value={formData.contador_escaner}
                      onChange={handleInputChange}
                      min="0"
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Solución Técnica */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Solución Técnica</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de solución</label>
                  <textarea
                    name="descripcion_solucion"
                    value={formData.descripcion_solucion}
                    onChange={handleInputChange}
                    rows={4}
                    disabled={loading || loadingData}
                    placeholder="Describe la solución aplicada, pasos realizados, etc."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Cambio de Piezas */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Cambio de Piezas (máx. 3 grupos)</h4>
                <div className="space-y-4">
                  {formData.piezas.map((pieza, index) => (
                    <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pieza {index + 1}</label>
                        <input
                          type="text"
                          name={`pieza_${index}_pieza`}
                          value={pieza.pieza}
                          onChange={handleInputChange}
                          disabled={loading || loadingData}
                          placeholder="Nombre de la pieza"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la pieza</label>
                        <select
                          name={`pieza_${index}_estado`}
                          value={pieza.estado_pieza}
                          onChange={handleInputChange}
                          disabled={loading || loadingData || !pieza.pieza || pieza.pieza.trim() === ""}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="nueva">Nueva</option>
                          <option value="reciclada">Reciclada</option>
                        </select>
                        {(!pieza.pieza || pieza.pieza.trim() === "") && (
                          <p className="mt-1 text-xs text-gray-500">Primero ingrese el nombre de la pieza</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mantenimiento realizado */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Mantenimiento realizado</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mantenimiento.limpieza_general"
                      checked={formData.mantenimiento.limpieza_general}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">Limpieza general</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mantenimiento.calibracion"
                      checked={formData.mantenimiento.calibracion}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">Calibración</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mantenimiento.revision_mecanica"
                      checked={formData.mantenimiento.revision_mecanica}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">Revisión mecánica</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mantenimiento.actualizacion_firmware"
                      checked={formData.mantenimiento.actualizacion_firmware}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">Actualización firmware</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mantenimiento.otros"
                      checked={formData.mantenimiento.otros}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">Otros</label>
                  </div>
                </div>
              </div>

              {/* Fechas y Estado Final */}
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Fechas y Estado Final</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Inicio de visita */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de visita</label>
                    <input
                      type="datetime-local"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Fin de visita */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin de visita</label>
                    <input
                      type="datetime-local"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Estado final de la máquina */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado final de la máquina</label>
                    <select
                      name="estado_final_maquina"
                      value={formData.estado_final_maquina}
                      onChange={handleInputChange}
                      disabled={loading || loadingData}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="funcionando">Funcionando</option>
                      <option value="parada">Parada</option>
                    </select>
                  </div>
                </div>

                {/* Observaciones del técnico */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones del técnico</label>
                  <textarea
                    name="observaciones_tecnico"
                    value={formData.observaciones_tecnico}
                    onChange={handleInputChange}
                    rows={4}
                    disabled={loading || loadingData}
                    placeholder="Observaciones adicionales, recomendaciones, etc."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading || loadingData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingData}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear visita
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

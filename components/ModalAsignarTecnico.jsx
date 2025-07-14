"use client"

import { useState, useEffect } from "react"
import { averiasService } from "../services/averiasService"

export const ModalAsignarTecnico = ({
  isOpen,
  onClose,
  onSuccess,
  averiaId,
  averiaCodigo,
  tecnicoActual = null, // Nuevo prop para técnico actual
}) => {
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingTecnicos, setLoadingTecnicos] = useState(false)
  const [error, setError] = useState("")
  const [showNotificationModal, setShowNotificationModal] = useState(false)

  // Determinar si es asignación o reasignación
  const isReasignacion = tecnicoActual && tecnicoActual.id_usuario

  useEffect(() => {
    if (isOpen) {
      cargarTecnicos()
      // Si hay técnico actual, preseleccionarlo
      setTecnicoSeleccionado(tecnicoActual?.id_usuario || "")
      setError("")
    }
  }, [isOpen, tecnicoActual])

  const cargarTecnicos = async () => {
    try {
      setLoadingTecnicos(true)
      const data = await averiasService.obtenerTecnicos()
      console.log("Técnicos cargados:", data)
      setTecnicos(data)
    } catch (error) {
      console.error("Error cargando técnicos:", error)
      setError("Error al cargar la lista de técnicos")
    } finally {
      setLoadingTecnicos(false)
    }
  }

  const handleAsignar = async () => {
    if (!tecnicoSeleccionado) {
      setError("Debe seleccionar un técnico")
      return
    }

    // Si es reasignación y selecciona el mismo técnico, no hacer nada
    if (isReasignacion && tecnicoSeleccionado === tecnicoActual?.id_usuario) {
      setError("Debe seleccionar un técnico diferente al actual")
      return
    }

    try {
      setLoading(true)
      setError("")

      console.log(`${isReasignacion ? "Reasignando" : "Asignando"} técnico:`, {
        averiaId,
        tecnicoSeleccionado,
        tecnicoAnterior: tecnicoActual?.id_usuario,
      })

      await averiasService.asignarTecnico(averiaId, tecnicoSeleccionado)

      // Mostrar modal de notificación
      setShowNotificationModal(true)
    } catch (error) {
      console.error("Error asignando técnico:", error)
      setError(`Error al ${isReasignacion ? "reasignar" : "asignar"} el técnico. Intente nuevamente.`)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationResponse = (notify) => {
    console.log("Respuesta de notificación:", notify)
    // Por ahora solo cerramos el modal, sin lógica real de notificación
    setShowNotificationModal(false)
    onSuccess() // Recargar datos en el componente padre
    handleClose()
  }

  const handleClose = () => {
    setTecnicoSeleccionado("")
    setError("")
    setShowNotificationModal(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal principal de asignación/reasignación */}
      {!showNotificationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">
                      {isReasignacion ? "Reasignar Técnico" : "Asignar Técnico"}
                    </h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {isReasignacion ? (
                      <>
                        Selecciona un nuevo técnico para reasignar la avería <strong>{averiaCodigo}</strong>
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">
                          Técnico actual: <strong>{tecnicoActual?.nombre}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        Selecciona un técnico para asignar a la avería <strong>{averiaCodigo}</strong>
                      </>
                    )}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
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

                {/* Lista de técnicos */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {isReasignacion ? "Seleccionar nuevo técnico" : "Seleccionar técnico"}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {loadingTecnicos ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Cargando técnicos...</span>
                    </div>
                  ) : tecnicos.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay técnicos disponibles</h3>
                      <p className="text-gray-600">No se encontraron técnicos activos en el sistema.</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                      {tecnicos.map((tecnico) => {
                        const isCurrentTechnician = tecnico.id_usuario === tecnicoActual?.id_usuario

                        return (
                          <label
                            key={tecnico.id_usuario}
                            className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              tecnicoSeleccionado === tecnico.id_usuario ? "bg-blue-50 border-blue-200" : ""
                            } ${isCurrentTechnician ? "bg-yellow-50" : ""}`}
                          >
                            <input
                              type="radio"
                              name="tecnico"
                              value={tecnico.id_usuario}
                              checked={tecnicoSeleccionado === tecnico.id_usuario}
                              onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {tecnico.nombre.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-gray-900">{tecnico.nombre}</p>
                                    {isCurrentTechnician && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Actual
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{tecnico.email}</p>
                                </div>
                              </div>
                            </div>
                            {tecnicoSeleccionado === tecnico.id_usuario && (
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-blue-600"
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
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAsignar}
                  disabled={loading || !tecnicoSeleccionado || loadingTecnicos}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {isReasignacion ? "Reasignando..." : "Asignando..."}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {isReasignacion ? "Reasignar técnico" : "Asignar técnico"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notificación */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Técnico {isReasignacion ? "reasignado" : "asignado"} correctamente
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        El técnico ha sido {isReasignacion ? "reasignado" : "asignado"} a la avería{" "}
                        <strong>{averiaCodigo}</strong>.
                        <br />
                        ¿Deseas notificar al técnico sobre esta {isReasignacion ? "reasignación" : "asignación"}?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleNotificationResponse(true)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleNotificationResponse(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

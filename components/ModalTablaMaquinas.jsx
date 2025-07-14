"use client"

import { useState, useEffect } from "react"
import { averiasService } from "../services/averiasService"

export const ModalTablaMaquinas = ({ isOpen, onClose, onSelectMaquina }) => {
  const [maquinas, setMaquinas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filtro, setFiltro] = useState("")
  const [maquinasFiltradas, setMaquinasFiltradas] = useState([])

  useEffect(() => {
    if (isOpen) {
      cargarMaquinas()
    }
  }, [isOpen])

  useEffect(() => {
    // Filtrar máquinas localmente
    if (filtro.trim() === "") {
      setMaquinasFiltradas(maquinas)
    } else {
      const filtroLower = filtro.toLowerCase()
      const filtradas = maquinas.filter(
        (maquina) =>
          maquina.numero_interno?.toLowerCase().includes(filtroLower) ||
          maquina.modelo?.toLowerCase().includes(filtroLower) ||
          maquina.ubicacion?.toLowerCase().includes(filtroLower) ||
          maquina.marca?.toLowerCase().includes(filtroLower) ||
          maquina.numero_serie?.toLowerCase().includes(filtroLower),
      )
      setMaquinasFiltradas(filtradas)
    }
  }, [filtro, maquinas])

  const cargarMaquinas = async () => {
    try {
      setLoading(true)
      setError("")
      // Cargar todas las máquinas sin filtro
      const data = await averiasService.obtenerMaquinas("")
      setMaquinas(data)
      setMaquinasFiltradas(data)
    } catch (error) {
      console.error("Error cargando máquinas:", error)
      setError("Error al cargar las máquinas")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMaquina = (maquina) => {
    onSelectMaquina(maquina)
    handleClose()
  }

  const handleClose = () => {
    setFiltro("")
    setError("")
    onClose()
  }

  const getEstadoMaquina = (maquina) => {
    // Simular estado basado en datos disponibles
    return maquina.activo !== false ? "Activa" : "Inactiva"
  }

  const getEstadoColor = (estado) => {
    return estado === "Activa" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
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
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Seleccionar Máquina</h3>
                <span className="ml-3 text-sm text-gray-500">
                  ({maquinasFiltradas.length} {maquinasFiltradas.length === 1 ? "máquina" : "máquinas"})
                </span>
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

          {/* Filtro */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="relative">
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
                placeholder="Filtrar por número interno, modelo, ubicación, marca o serie..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando máquinas...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
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
                  onClick={cargarMaquinas}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            ) : maquinasFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filtro ? "No se encontraron máquinas" : "No hay máquinas disponibles"}
                </h3>
                <p className="text-gray-600">
                  {filtro
                    ? "Intenta con un término de búsqueda diferente"
                    : "No hay máquinas registradas en el sistema"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número Interno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marca
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {maquinasFiltradas.map((maquina) => (
                      <tr
                        key={maquina.id_maquina}
                        onClick={() => handleSelectMaquina(maquina)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-blue-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{maquina.numero_interno}</div>
                              {maquina.numero_serie && (
                                <div className="text-sm text-gray-500">S/N: {maquina.numero_serie}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{maquina.modelo || "Sin especificar"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{maquina.ubicacion || "Sin especificar"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{maquina.marca || "Sin especificar"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(
                              getEstadoMaquina(maquina),
                            )}`}
                          >
                            {getEstadoMaquina(maquina)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectMaquina(maquina)
                            }}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {maquinasFiltradas.length > 0 && (
                <>
                  Mostrando {maquinasFiltradas.length} de {maquinas.length} máquinas
                  {filtro && <span className="font-medium"> (filtradas)</span>}
                </>
              )}
            </div>
            <button
              onClick={handleClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

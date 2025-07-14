import { supabase } from "./supabaseClient"

export const averiasService = {
  // Listar averías según el rol del usuario
  async listarAverias(userRole, userId) {
    try {
      let query = supabase
        .from("averias")
        .select(`
          id_averia,
          codigo,
          fecha_creacion,
          estado,
          urgencia,
          tipo_averia,
          observaciones,
          persona_contacto,
          email_contacto,
          id_tecnico_asignado,
          id_maquina,
          equipos:id_maquina (
            ubicacion,
            numero_interno,
            modelo
          ),
          tecnico:id_tecnico_asignado (
            nombre
          )
        `)
        .order("fecha_creacion", { ascending: false })

      // Filtrar según el rol
      if (userRole === "tecnico") {
        // Los técnicos solo ven sus averías asignadas
        query = query.eq("id_tecnico_asignado", userId)
      }
      // superusuario y oficina ven todas las averías (sin filtro adicional)

      const { data, error } = await query

      if (error) {
        console.error("Error obteniendo averías:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error en listarAverias:", error)
      throw error
    }
  },

  // Listar averías con filtros aplicados
  async listarAveriasFiltrado(userRole, userId, filtros = {}, searchTerm = "") {
    try {
      let query = supabase
        .from("averias")
        .select(`
          id_averia,
          codigo,
          fecha_creacion,
          estado,
          urgencia,
          tipo_averia,
          observaciones,
          persona_contacto,
          email_contacto,
          id_tecnico_asignado,
          id_maquina,
          equipos:id_maquina (
            ubicacion,
            numero_interno,
            modelo
          ),
          tecnico:id_tecnico_asignado (
            nombre
          )
        `)
        .order("fecha_creacion", { ascending: false })
        .limit(100) // Limitar resultados para performance

      // Filtrar según el rol (mantener lógica existente)
      if (userRole === "tecnico") {
        query = query.eq("id_tecnico_asignado", userId)
      }

      // Aplicar filtros adicionales
      if (filtros.estado && filtros.estado !== "") {
        query = query.eq("estado", filtros.estado)
      }

      if (filtros.urgencia && filtros.urgencia !== "") {
        query = query.eq("urgencia", Number.parseInt(filtros.urgencia))
      }

      if (filtros.id_tecnico_asignado && filtros.id_tecnico_asignado !== "") {
        query = query.eq("id_tecnico_asignado", filtros.id_tecnico_asignado)
      }

      if (filtros.tipo_averia && filtros.tipo_averia !== "") {
        query = query.eq("tipo_averia", filtros.tipo_averia)
      }

      if (filtros.fecha_desde && filtros.fecha_desde !== "") {
        query = query.gte("fecha_creacion", `${filtros.fecha_desde}T00:00:00`)
      }

      if (filtros.fecha_hasta && filtros.fecha_hasta !== "") {
        query = query.lte("fecha_creacion", `${filtros.fecha_hasta}T23:59:59`)
      }

      // Aplicar búsqueda por texto si se proporciona
      if (searchTerm && searchTerm.trim() !== "") {
        const searchTermClean = searchTerm.trim()

        // Buscar en múltiples campos usando OR
        query = query.or(
          `codigo.ilike.%${searchTermClean}%,` +
            `observaciones.ilike.%${searchTermClean}%,` +
            `persona_contacto.ilike.%${searchTermClean}%,` +
            `email_contacto.ilike.%${searchTermClean}%,` +
            `tipo_averia.ilike.%${searchTermClean}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Error obteniendo averías filtradas:", error)
        throw error
      }

      // Si hay searchTerm, también filtrar por ubicación de máquina (relación)
      let resultados = data || []

      if (searchTerm && searchTerm.trim() !== "" && resultados.length > 0) {
        const searchTermLower = searchTerm.trim().toLowerCase()
        resultados = resultados.filter((averia) => {
          // Verificar si coincide con ubicación de la máquina
          const ubicacionMatch = averia.equipos?.ubicacion?.toLowerCase().includes(searchTermLower)

          // Si ya pasó el filtro de Supabase O coincide con ubicación, incluirlo
          return true || ubicacionMatch
        })
      }

      return resultados
    } catch (error) {
      console.error("Error en listarAveriasFiltrado:", error)
      throw error
    }
  },

  // Obtener avería por ID - CORREGIDO para traer correctamente el técnico
  async obtenerAveriaPorId(id) {
    try {
      console.log("Obteniendo avería por ID:", id)

      const { data, error } = await supabase
        .from("averias")
        .select(`
          *,
          equipos:id_maquina (
            id_maquina,
            numero_interno,
            numero_serie,
            modelo,
            ubicacion,
            marca
          ),
          tecnico:id_tecnico_asignado (
            id_usuario,
            nombre,
            email
          ),
          creador:creado_por (
            nombre,
            email
          )
        `)
        .eq("id_averia", id)
        .single()

      if (error) {
        console.error("Error obteniendo avería:", error)
        throw error
      }

      console.log("Avería obtenida:", {
        id_averia: data.id_averia,
        id_tecnico_asignado: data.id_tecnico_asignado,
        tecnico: data.tecnico,
        tipoTecnicoId: typeof data.id_tecnico_asignado,
      })

      return data
    } catch (error) {
      console.error("Error en obtenerAveriaPorId:", error)
      throw error
    }
  },

  // Actualizar avería
  async actualizarAveria(id, payload) {
    try {
      const {
        estado,
        urgencia,
        medio_contacto,
        email_contacto,
        persona_contacto,
        horario_solicitado,
        id_maquina,
        estado_maquina,
        tipo_averia,
        observaciones,
        id_tecnico_asignado,
      } = payload

      const { data, error } = await supabase
        .from("averias")
        .update({
          estado,
          urgencia,
          medio_contacto,
          email_contacto,
          persona_contacto,
          horario_solicitado,
          id_maquina,
          estado_maquina,
          tipo_averia,
          observaciones,
          id_tecnico_asignado,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id_averia", id)
        .select()
        .single()

      if (error) {
        console.error("Error actualizando avería:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error en actualizarAveria:", error)
      throw error
    }
  },

  // Eliminar avería
  async eliminarAveria(id) {
    try {
      const { error } = await supabase.from("averias").delete().eq("id_averia", id)

      if (error) {
        console.error("Error eliminando avería:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error en eliminarAveria:", error)
      throw error
    }
  },

  // Asignar técnico a avería (ahora funciona para asignar Y reasignar)
  async asignarTecnico(idAveria, idTecnico) {
    try {
      console.log("Asignando/Reasignando técnico:", { idAveria, idTecnico })

      const { data, error } = await supabase
        .from("averias")
        .update({
          id_tecnico_asignado: idTecnico,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id_averia", idAveria)
        .select()
        .single()

      if (error) {
        console.error("Error asignando técnico:", error)
        throw error
      }

      console.log("Técnico asignado/reasignado correctamente:", data)
      return data
    } catch (error) {
      console.error("Error en asignarTecnico:", error)
      throw error
    }
  },

  // Crear nueva avería
  async crearAveria(averiaData, userId) {
    try {
      const tecnicoAsignado =
        averiaData.id_tecnico_asignado && averiaData.id_tecnico_asignado !== "" ? averiaData.id_tecnico_asignado : null

      const { data, error } = await supabase
        .from("averias")
        .insert([
          {
            ...averiaData,
            id_tecnico_asignado: tecnicoAsignado,
            creado_por: userId,
            fecha_creacion: new Date().toISOString(),
          },
        ])
        .select()

      if (error) {
        console.error("Error creando avería:", error)
        throw error
      }

      return data[0]
    } catch (error) {
      console.error("Error en crearAveria:", error)
      throw error
    }
  },

  // Obtener máquinas para el select
  async obtenerMaquinas(searchTerm = "") {
    try {
      let query = supabase
        .from("maquinas")
        .select("id_maquina, numero_interno, numero_serie, modelo, ubicacion, marca")
        .order("numero_interno")

      if (searchTerm && searchTerm.length > 0) {
        // Búsqueda más amplia incluyendo marca
        query = query.or(
          `numero_interno.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%,ubicacion.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,numero_serie.ilike.%${searchTerm}%`,
        )
      } else {
        // Si no hay término de búsqueda, limitar resultados para performance
        query = query.limit(800)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error obteniendo máquinas:", error)
      throw error
    }
  },

  // Obtener técnicos para el select
  async obtenerTecnicos() {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id_usuario, nombre, email")
        .eq("rol", "tecnico")
        .eq("activo", true)
        .order("nombre")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error obteniendo técnicos:", error)
      throw error
    }
  },

  // Obtener todos los técnicos para el filtro (no solo activos)
  async obtenerTecnicosParaFiltro() {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id_usuario, nombre, email")
        .eq("rol", "tecnico")
        .order("nombre")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error obteniendo técnicos para filtro:", error)
      throw error
    }
  },

  // Obtener estadísticas de averías
  async obtenerEstadisticas(userRole, userId) {
    try {
      let query = supabase.from("averias").select("estado")

      if (userRole === "tecnico") {
        query = query.eq("id_tecnico_asignado", userId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        abiertas: data?.filter((a) => a.estado === "abierta").length || 0,
        pendientes: data?.filter((a) => a.estado === "pendiente").length || 0,
        cerradas: data?.filter((a) => a.estado === "cerrada").length || 0,
      }

      return stats
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error)
      throw error
    }
  },

  // Formatear código de avería
  formatearCodigo(idAveria) {
    return `AVR-${String(idAveria).padStart(4, "0")}`
  },

  // Obtener color del badge según estado
  obtenerColorEstado(estado) {
    const colores = {
      abierta: "bg-red-100 text-red-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      en_proceso: "bg-blue-100 text-blue-800",
      cerrada: "bg-green-100 text-green-800",
    }
    return colores[estado] || "bg-gray-100 text-gray-800"
  },

  // Obtener color del ícono según estado
  obtenerColorIconoEstado(estado) {
    const colores = {
      abierta: "text-red-600",
      pendiente: "text-yellow-600",
      en_proceso: "text-blue-600",
      cerrada: "text-green-600",
    }
    return colores[estado] || "text-gray-600"
  },

  // Formatear fecha
  formatearFecha(fecha) {
    if (!fecha) return "Sin fecha"
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  },

  // Formatear fecha y hora
  formatearFechaHora(fecha) {
    if (!fecha) return "Sin fecha"
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  },

  // Opciones para los selects
  opcionesEstado: [
    { value: "abierta", label: "Abierta" },
    { value: "cerrada", label: "Cerrada" },
    { value: "pendiente", label: "Pendiente piezas" },
  ],

  opcionesUrgencia: [
    { value: 1, label: "1 - Alta" },
    { value: 2, label: "2 - Media" },
    { value: 3, label: "3 - Baja" },
  ],

  opcionesMedioContacto: [
    { value: "correo", label: "Correo" },
    { value: "telefono", label: "Teléfono" },
    { value: "helpdesk", label: "Helpdesk" },
  ],

  opcionesEstadoMaquina: [
    { value: "funcionando", label: "Funcionando" },
    { value: "parada", label: "Parada" },
    { value: "baja_produccion", label: "Baja producción" },
  ],

  opcionesTipoAveria: [
    { value: "hardware", label: "Hardware" },
    { value: "software", label: "Software" },
    { value: "conectividad", label: "Conectividad" },
    { value: "suministros", label: "Suministros" },
    { value: "otros", label: "Otros" },
  ],
}

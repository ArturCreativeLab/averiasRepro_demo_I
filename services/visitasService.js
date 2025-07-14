import { supabase } from "./supabaseClient"

export const visitasService = {
  // Listar visitas por avería
  async listarVisitasPorAveria(idAveria) {
    try {
      const { data, error } = await supabase
        .from("visitas")
        .select(`
          id_visita,
          codigo,
          fecha_programada,
          estado,
          observaciones,
          tecnico:id_tecnico (
            nombre,
            email
          )
        `)
        .eq("id_averia", idAveria)
        .order("fecha_programada", { ascending: false })

      if (error) {
        console.error("Error obteniendo visitas:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error en listarVisitasPorAveria:", error)
      throw error
    }
  },

  // Obtener visita por ID con todas las relaciones
  async obtenerVisitaPorId(idVisita) {
    try {
      console.log("Obteniendo visita por ID:", idVisita)

      const { data, error } = await supabase
        .from("visitas")
        .select(`
          *,
          perfiles:id_tecnico (
            id,
            nombre,
            email
          ),
          averias:id_averia (
            id_averia,
            codigo,
            id_maquina,
            maquinas:id_maquina (
              ubicacion,
              numero_interno,
              modelo
            )
          )
        `)
        .eq("id_visita", idVisita)
        .single()

      if (error) {
        console.error("Error obteniendo visita:", error)
        throw error
      }

      console.log("Visita obtenida:", data)
      return data
    } catch (error) {
      console.error("Error en obtenerVisitaPorId:", error)
      throw error
    }
  },

  // Actualizar visita por ID
  async actualizarVisita(idVisita, datosActualizados, userId) {
    try {
      console.log("Actualizando visita ID:", idVisita)
      console.log("Datos a actualizar:", datosActualizados)

      // Preparar los datos para la actualización según el schema real
      const updateData = {
        id_tecnico: datosActualizados.id_tecnico,
        fecha_visita: datosActualizados.fecha_visita,
        estado: datosActualizados.estado,
        contador_color: datosActualizados.contador_color || null,
        contador_bn: datosActualizados.contador_bn || null,
        contador_escaner: datosActualizados.contador_escaner || null,
        descripcion_solucion: datosActualizados.descripcion_solucion || null,
        solucion_aplicada: datosActualizados.solucion_aplicada || null,
        estado_final_maquina: datosActualizados.estado_final_maquina,
        pieza_1: datosActualizados.pieza_1 || null,
        estado_pieza_1: datosActualizados.estado_pieza_1 || null,
        pieza_2: datosActualizados.pieza_2 || null,
        estado_pieza_2: datosActualizados.estado_pieza_2 || null,
        pieza_3: datosActualizados.pieza_3 || null,
        estado_pieza_3: datosActualizados.estado_pieza_3 || null,
        mantenimiento: datosActualizados.mantenimiento || [], // Array de strings
        fecha_inicio: datosActualizados.fecha_inicio || null,
        fecha_fin: datosActualizados.fecha_fin || null,
        observaciones: datosActualizados.observaciones || null,
      }

      const { data, error } = await supabase.from("visitas").update(updateData).eq("id_visita", idVisita).select()

      if (error) {
        console.error("Error actualizando visita:", error)
        throw error
      }

      console.log("Visita actualizada con éxito:", data[0])
      return data[0]
    } catch (error) {
      console.error("Error en actualizarVisita:", error)
      throw error
    }
  },

  // Obtener averías disponibles para crear visitas
  async obtenerAveriasDisponibles() {
    try {
      console.log("Obteniendo averías disponibles...")

      const { data, error } = await supabase
        .from("averias")
        .select(`
          id_averia,
          codigo,
          id_tecnico_asignado,
          fecha_creacion,
          maquinas:id_maquina (
            ubicacion
          ),
          usuarios:id_tecnico_asignado (
            id_usuario,
            auth_user_id,
            nombre
          )
        `)
        .eq("estado", "abierta")
        .order("fecha_creacion", { ascending: false })

      if (error) {
        console.error("Error obteniendo averías disponibles:", error)
        throw error
      }

      console.log("Averías disponibles obtenidas:", data)
      return data || []
    } catch (error) {
      console.error("Error en obtenerAveriasDisponibles:", error)
      throw error
    }
  },

  // Obtener averías disponibles para un técnico específico
  async obtenerAveriasDisponiblesPorTecnico(idPerfilTecnico) {
    try {
      console.log("Obteniendo averías disponibles para técnico con perfil UUID:", idPerfilTecnico)

      // Validar que el ID del perfil técnico esté disponible
      if (!idPerfilTecnico) {
        console.warn("ID de perfil técnico no disponible.")
        return []
      }

      // Primero obtener el id_usuario del perfil usando el UUID
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id_usuario")
        .eq("auth_user_id", idPerfilTecnico)
        .single()

      if (usuarioError || !usuarioData) {
        console.error("Error obteniendo usuario por perfil UUID:", usuarioError)
        console.warn("No se encontró usuario para el perfil:", idPerfilTecnico)
        return []
      }

      console.log("Usuario encontrado para perfil:", {
        perfilUUID: idPerfilTecnico,
        idUsuario: usuarioData.id_usuario,
      })

      // Ahora buscar averías asignadas a este técnico
      const { data, error } = await supabase
        .from("averias")
        .select(`
          id_averia,
          codigo,
          id_tecnico_asignado,
          fecha_creacion,
          maquinas:id_maquina (
            ubicacion
          ),
          usuarios:id_tecnico_asignado (
            id_usuario,
            auth_user_id,
            nombre
          )
        `)
        .eq("estado", "abierta")
        .eq("id_tecnico_asignado", usuarioData.id_usuario)
        .order("fecha_creacion", { ascending: false })

      if (error) {
        console.error("Error obteniendo averías disponibles para técnico:", error)
        throw error
      }

      console.log("Averías disponibles para técnico obtenidas:", {
        cantidad: data?.length || 0,
        averias: data,
      })

      return data || []
    } catch (error) {
      console.error("Error en obtenerAveriasDisponiblesPorTecnico:", error)
      throw error
    }
  },

  // Obtener técnicos disponibles desde la tabla perfiles
  async obtenerTecnicosDisponibles() {
    try {
      console.log("Obteniendo técnicos disponibles desde perfiles...")

      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .eq("rol", "tecnico")
        .order("nombre")

      if (error) {
        console.error("Error obteniendo técnicos:", error)
        throw error
      }

      console.log("Técnicos disponibles obtenidos:", data)
      return data || []
    } catch (error) {
      console.error("Error en obtenerTecnicosDisponibles:", error)
      throw error
    }
  },

  // Nueva función para traducir id_usuario (BIGINT) a perfil UUID
  async obtenerPerfilTecnicoPorUsuarioId(idUsuario) {
    try {
      console.log("Traduciendo id_usuario a perfil UUID:", idUsuario)

      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          auth_user_id,
          perfiles:auth_user_id (
            id,
            nombre,
            email
          )
        `)
        .eq("id_usuario", idUsuario)
        .single()

      if (error) {
        console.error("Error obteniendo perfil por usuario ID:", error)
        return null
      }

      console.log("Perfil encontrado:", data)
      return data?.perfiles || null
    } catch (error) {
      console.error("Error en obtenerPerfilTecnicoPorUsuarioId:", error)
      return null
    }
  },

  // Formatear código de avería
  formatearCodigoAveria(idAveria) {
    return `AVR-${String(idAveria).padStart(4, "0")}`
  },

  // Obtener color del badge según estado
  obtenerColorEstado(estado) {
    const colores = {
      programada: "bg-blue-100 text-blue-800",
      en_curso: "bg-yellow-100 text-yellow-800",
      completada: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
    }
    return colores[estado] || "bg-gray-100 text-gray-800"
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

  // Formatear fecha para input datetime-local
  formatearFechaParaInput(fecha) {
    if (!fecha) return ""
    const date = new Date(fecha)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  },

  // Formatear fecha para input date
  formatearFechaParaInputDate(fecha) {
    if (!fecha) return ""
    const date = new Date(fecha)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  },

  // Parsear array de mantenimiento a checkboxes
  parsearMantenimiento(mantenimientoArray) {
    const mantenimiento = mantenimientoArray || []
    return {
      limpieza_general: mantenimiento.includes("Limpieza general"),
      calibracion: mantenimiento.includes("Calibración"),
      revision_mecanica: mantenimiento.includes("Revisión mecánica"),
      actualizacion_firmware: mantenimiento.includes("Actualización firmware"),
    }
  },

  // Construir array de mantenimiento desde checkboxes
  construirArrayMantenimiento(checkboxes) {
    const mantenimiento = []
    if (checkboxes.limpieza_general) mantenimiento.push("Limpieza general")
    if (checkboxes.calibracion) mantenimiento.push("Calibración")
    if (checkboxes.revision_mecanica) mantenimiento.push("Revisión mecánica")
    if (checkboxes.actualizacion_firmware) mantenimiento.push("Actualización firmware")
    return mantenimiento
  },

  // Listar todas las visitas con relaciones, filtros y búsqueda
  async listarVisitas(filtros = {}, terminoBusqueda = "") {
    try {
      console.log("Aplicando filtros:", filtros)
      console.log("Término de búsqueda:", terminoBusqueda)

      let query = supabase.from("visitas").select(`
        id_visita,
        codigo,
        fecha_visita,
        fecha_programada,
        estado,
        observaciones,
        perfiles: id_tecnico (
          id,
          nombre
        ),
        averias: id_averia (
          codigo,
          maquinas: id_maquina (
            ubicacion
          )
        )
      `)

      // Aplicar filtros regulares
      if (filtros.tecnico && filtros.tecnico !== "") {
        query = query.eq("id_tecnico", filtros.tecnico)
      }

      if (filtros.estado && filtros.estado !== "" && filtros.estado !== "Todos") {
        query = query.eq("estado", filtros.estado.toLowerCase())
      }

      if (filtros.fechaDesde) {
        query = query.gte("fecha_visita", filtros.fechaDesde)
      }

      if (filtros.fechaHasta) {
        query = query.lte("fecha_visita", filtros.fechaHasta)
      }

      // Para filtrar por ubicación necesitamos hacer un join más complejo
      if (filtros.ubicacion && filtros.ubicacion.trim() !== "") {
        // Primero obtenemos las máquinas que coinciden con la ubicación
        const { data: maquinasData, error: maquinasError } = await supabase
          .from("maquinas")
          .select("id_maquina")
          .ilike("ubicacion", `%${filtros.ubicacion}%`)

        if (maquinasError) {
          console.error("Error filtrando por ubicación:", maquinasError)
        } else if (maquinasData && maquinasData.length > 0) {
          const idsMaquinas = maquinasData.map((m) => m.id_maquina)

          // Luego obtenemos las averías de esas máquinas
          const { data: averiasData, error: averiasError } = await supabase
            .from("averias")
            .select("id_averia")
            .in("id_maquina", idsMaquinas)

          if (averiasError) {
            console.error("Error obteniendo averías por ubicación:", averiasError)
          } else if (averiasData && averiasData.length > 0) {
            const idsAverias = averiasData.map((a) => a.id_averia)
            query = query.in("id_averia", idsAverias)
          } else {
            // Si no hay averías que coincidan, devolver array vacío
            return []
          }
        } else {
          // Si no hay máquinas que coincidan, devolver array vacío
          return []
        }
      }

      // Aplicar búsqueda por término si se proporciona
      if (terminoBusqueda && terminoBusqueda.trim() !== "") {
        const termino = terminoBusqueda.trim()

        // Primero obtenemos todos los IDs que coinciden con la búsqueda
        const idsVisitasEncontradas = new Set()

        // Búsqueda en código de visita y estado
        const { data: visitasPorCodigo, error: errorCodigo } = await supabase
          .from("visitas")
          .select("id_visita")
          .or(`codigo.ilike.%${termino}%,estado.ilike.%${termino}%`)

        if (!errorCodigo && visitasPorCodigo) {
          visitasPorCodigo.forEach((v) => idsVisitasEncontradas.add(v.id_visita))
        }

        // Búsqueda en nombre de técnico
        const { data: tecnicosEncontrados, error: errorTecnicos } = await supabase
          .from("perfiles")
          .select("id")
          .ilike("nombre", `%${termino}%`)

        if (!errorTecnicos && tecnicosEncontrados && tecnicosEncontrados.length > 0) {
          const idsTecnicos = tecnicosEncontrados.map((t) => t.id)
          const { data: visitasPorTecnico, error: errorVisitasTecnico } = await supabase
            .from("visitas")
            .select("id_visita")
            .in("id_tecnico", idsTecnicos)

          if (!errorVisitasTecnico && visitasPorTecnico) {
            visitasPorTecnico.forEach((v) => idsVisitasEncontradas.add(v.id_visita))
          }
        }

        // Búsqueda en código de avería
        const { data: averiasEncontradas, error: errorAverias } = await supabase
          .from("averias")
          .select("id_averia")
          .ilike("codigo", `%${termino}%`)

        if (!errorAverias && averiasEncontradas && averiasEncontradas.length > 0) {
          const idsAverias = averiasEncontradas.map((a) => a.id_averia)
          const { data: visitasPorAveria, error: errorVisitasAveria } = await supabase
            .from("visitas")
            .select("id_visita")
            .in("id_averia", idsAverias)

          if (!errorVisitasAveria && visitasPorAveria) {
            visitasPorAveria.forEach((v) => idsVisitasEncontradas.add(v.id_visita))
          }
        }

        // Búsqueda en ubicación de máquina
        const { data: maquinasEncontradas, error: errorMaquinas } = await supabase
          .from("maquinas")
          .select("id_maquina")
          .ilike("ubicacion", `%${termino}%`)

        if (!errorMaquinas && maquinasEncontradas && maquinasEncontradas.length > 0) {
          const idsMaquinas = maquinasEncontradas.map((m) => m.id_maquina)

          // Obtener averías de esas máquinas
          const { data: averiasDeUbicacion, error: errorAveriasUbicacion } = await supabase
            .from("averias")
            .select("id_averia")
            .in("id_maquina", idsMaquinas)

          if (!errorAveriasUbicacion && averiasDeUbicacion && averiasDeUbicacion.length > 0) {
            const idsAveriasUbicacion = averiasDeUbicacion.map((a) => a.id_averia)
            const { data: visitasPorUbicacion, error: errorVisitasUbicacion } = await supabase
              .from("visitas")
              .select("id_visita")
              .in("id_averia", idsAveriasUbicacion)

            if (!errorVisitasUbicacion && visitasPorUbicacion) {
              visitasPorUbicacion.forEach((v) => idsVisitasEncontradas.add(v.id_visita))
            }
          }
        }

        // Si encontramos IDs, filtrar por ellos
        if (idsVisitasEncontradas.size > 0) {
          const idsArray = Array.from(idsVisitasEncontradas)
          query = query.in("id_visita", idsArray)
        } else {
          // Si no se encontraron coincidencias, devolver array vacío
          return []
        }
      }

      query = query.order("fecha_visita", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error obteniendo visitas:", error)
        throw error
      }

      console.log("Visitas obtenidas con filtros y búsqueda:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error en listarVisitas:", error)
      throw error
    }
  },

  // Crear nueva visita
  async crearVisita(visitaData, userId) {
    try {
      console.log("Creando visita:", visitaData)
      console.log("Usuario creador (perfil UUID):", userId)

      // Preparar datos para inserción
      const insertData = {
        id_averia: visitaData.id_averia,
        id_tecnico: visitaData.id_tecnico,
        fecha_visita: visitaData.fecha_visita,
        fecha_programada: visitaData.fecha_visita, // Por ahora usar la misma fecha
        estado: visitaData.estado || "pendiente",
        observaciones: visitaData.observaciones_tecnico || null,
        creado_por: userId, // Este debe ser el UUID del perfil
        fecha_creacion: new Date().toISOString(),
        // Campos opcionales
        contador_color: visitaData.contador_color || null,
        contador_bn: visitaData.contador_bn || null,
        contador_escaner: visitaData.contador_escaner || null,
        descripcion_solucion: visitaData.descripcion_solucion || null,
        solucion_aplicada: visitaData.solucion_aplicada || null,
        fecha_inicio: visitaData.fecha_inicio || null,
        fecha_fin: visitaData.fecha_fin || null,
        estado_final_maquina: visitaData.estado_final_maquina || null,
        mantenimiento: Array.isArray(visitaData.mantenimiento) ? visitaData.mantenimiento : [],
      }

      // Agregar piezas solo si existen
      if (visitaData.pieza_1) {
        insertData.pieza_1 = visitaData.pieza_1
        insertData.estado_pieza_1 = visitaData.estado_pieza_1
      }
      if (visitaData.pieza_2) {
        insertData.pieza_2 = visitaData.pieza_2
        insertData.estado_pieza_2 = visitaData.estado_pieza_2
      }
      if (visitaData.pieza_3) {
        insertData.pieza_3 = visitaData.pieza_3
        insertData.estado_pieza_3 = visitaData.estado_pieza_3
      }

      const { data, error } = await supabase.from("visitas").insert([insertData]).select()

      if (error) {
        console.error("Error creando visita:", error)
        throw error
      }

      console.log("Visita creada exitosamente:", data[0])
      return data[0]
    } catch (error) {
      console.error("Error en crearVisita:", error)
      throw error
    }
  },
}

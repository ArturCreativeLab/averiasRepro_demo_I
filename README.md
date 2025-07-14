# Gestor de Averías - Reproexprés

Sistema de gestión de averías técnicas para equipos de impresión en centros de autoservicio.

## 🚀 Estructura del Proyecto

\`\`\`
/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal con AuthProvider
│   ├── page.tsx           # Página de inicio (redirección)
│   └── globals.css        # Estilos globales con Tailwind
├── components/            # Componentes reutilizables
│   ├── LoginForm.jsx      # Formulario de login
│   ├── Navbar.jsx         # Barra de navegación
│   ├── ProtectedRoute.jsx # Protección de rutas
│   ├── RoleBasedComponent.jsx # Componentes según rol
│   └── LoadingSpinner.jsx # Spinner de carga
├── context/               # Contextos de React
│   └── AuthContext.jsx    # Manejo de autenticación y roles
├── pages/                 # Páginas de la aplicación
│   ├── login.jsx          # Página de login
│   ├── dashboard.jsx      # Dashboard principal
│   └── unauthorized.jsx   # Página de acceso denegado
├── services/              # Lógica de acceso a datos
│   ├── supabaseClient.js  # Cliente de Supabase
│   └── authService.js     # Servicios de autenticación
└── assets/                # Recursos estáticos (logos, iconos)
\`\`\`

## 🔐 Sistema de Roles

- **superusuario**: Acceso completo al sistema
- **jefe_tecnico**: Gestión de técnicos y averías
- **oficina**: Registro y seguimiento de averías
- **tecnico**: Gestión de visitas asignadas

## 🛠️ Configuración Inicial

1. **Configurar Supabase**:
   - Actualiza `services/supabaseClient.js` con tus credenciales
   - Configura las tablas según la estructura de BD proporcionada

2. **Instalar dependencias**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Ejecutar en desarrollo**:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📋 Funcionalidades Implementadas

✅ **Autenticación**:
- Login con email/contraseña
- Verificación de usuarios activos
- Manejo de sesiones
- Logout seguro

✅ **Control de Acceso**:
- Protección de rutas por rol
- Componentes condicionales según permisos
- Jerarquía de roles

✅ **Interfaz Base**:
- Dashboard responsive
- Navbar con información del usuario
- Páginas de error y acceso denegado
- Estilos con Tailwind CSS

## 🔄 Migración a MySQL

La estructura está preparada para migrar fácilmente:
- Toda la lógica de BD está en `/services`
- Los componentes no dependen de Supabase
- Estructura de datos compatible con MySQL

## 📝 Próximos Pasos

1. Implementar módulo de averías
2. Desarrollar sistema de visitas
3. Agregar notificaciones
4. Crear reportes y estadísticas
5. Migrar a API REST + MySQL

## 🎨 Personalización

- Colores de marca en `tailwind.config.js`
- Estilos personalizados en `app/globals.css`
- Componentes reutilizables en `/components`

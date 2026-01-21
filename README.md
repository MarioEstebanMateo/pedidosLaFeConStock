# App Pedidos La Fe Con Stock

Sistema web para gestión de pedidos con control de stock para La Fe. Permite a los usuarios calcular pedidos automáticamente basándose en el stock actual y el stock mínimo configurado.

## 🚀 Características

### Para Usuarios
- **Selección de Sucursal**: Elige entre Centro y CABA
- **Gestión de Stock Actual**: Ingresa el stock actual de cada producto con botones +/-
- **Cálculo Automático de Pedidos**: El sistema calcula automáticamente cuánto necesitas pedir (Stock Mínimo - Stock Actual)
- **Múltiples Categorías**: 
  - Helados (con opción de ordenar alfabéticamente)
  - Palitos
  - Postres
  - Crocker
  - Dietéticos
  - Buffet
  - Softs
  - Dulces
  - Paletas
  - Bites
  - Barritas
  - Térmicos
- **Revisión de Pedido**: Visualiza el resumen completo antes de enviar
- **Envío por WhatsApp**: Envía el pedido formateado directamente por WhatsApp
- **Observaciones**: Campo especial para agregar notas (disponible para Centro)

### Panel Administrativo
- **Gestión de Productos**: Agregar, editar o eliminar productos
- **Control de Stock Mínimo**: Configura el stock mínimo para cada producto
- **Visibilidad de Productos**: Oculta/muestra productos sin necesidad de eliminarlos
- **Multi-sucursal**: Administra productos para Centro y CABA por separado
- **Autenticación**: Acceso protegido con usuario y contraseña

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM
- **Base de Datos**: Supabase (PostgreSQL)
- **Estilos**: Tailwind CSS
- **Alertas**: SweetAlert2
- **Estado Global**: Context API

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Cuenta de Supabase
- Navegador web moderno

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/MarioEstebanMateo/pedidosLaFeConStock.git
cd pedidosLaFeConStock
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `src/db/SupabaseClient.jsx` con tu configuración de Supabase:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseAnonKey = 'TU_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
```

4. **Configurar la base de datos**

Ejecuta el script SQL proporcionado en `product-and-order-management-system-1747963838997.sql` o crea las siguientes tablas:

**Tablas de productos** (para cada categoría, crear versión _centro y _caba):
```sql
CREATE TABLE helados_centro (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  stock_min INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true
);

-- Repetir para: palitos, postres, crocker, dieteticos, buffet, 
-- softs, dulces, paletas, bites, barritas, termicos
```

**Tabla de sucursales**:
```sql
CREATE TABLE sucursales (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

INSERT INTO sucursales (title) VALUES ('Centro'), ('CABA');
```

**Tabla de administradores**:
```sql
CREATE TABLE admin_centro (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
```

**Tabla de pedidos**:
```sql
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  sucursal_id INTEGER REFERENCES sucursales(id),
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📱 Uso

### Crear un Pedido

1. Selecciona la fecha de entrega
2. Elige la sucursal (Centro o CABA)
3. Ingresa el stock actual de cada producto usando los botones +/-
4. El sistema calculará automáticamente lo que necesitas pedir
5. Haz clic en "Revisar Pedido"
6. Verifica el resumen y envía por WhatsApp

### Acceso al Panel Administrativo

1. Haz clic en "Acceso Administrativo" al final de la página principal
2. Ingresa usuario y contraseña
3. Selecciona la sucursal a administrar
4. Gestiona productos:
   - **Agregar**: Completa el formulario y haz clic en "Agregar"
   - **Editar**: Haz clic en el botón "Editar" de cualquier producto
   - **Ocultar/Mostrar**: Usa el botón de visibilidad para ocultar productos temporalmente
   - **Eliminar**: Elimina productos que ya no se usen

## 🔐 Seguridad

- Las credenciales de administrador se almacenan en Supabase
- Se recomienda usar Row Level Security (RLS) en Supabase para mayor seguridad
- La autenticación del admin se valida en cada carga de página

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm run preview` - Previsualiza la versión de producción
- `npm run lint` - Ejecuta el linter

## 🌐 Despliegue

La aplicación puede desplegarse en cualquier servicio de hosting estático como:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

```bash
npm run build
# Los archivos compilados estarán en la carpeta 'dist'
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a La Fe.

## 👥 Autor

Mario Esteban Mateo - [GitHub](https://github.com/MarioEstebanMateo)

## 📞 Soporte

Para reportar problemas o sugerencias, por favor abre un issue en el repositorio de GitHub.

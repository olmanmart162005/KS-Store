# KS STORE — Catálogo Digital Profesional & Streetwear

Bienvenido a la plataforma web oficial de **KS Store**, un catálogo digital profesional, moderno, ultra rápido y completamente responsive para moda urbana, gorras de diseñador exclusivas (con pedrería, bordados 3D y ediciones New Era) y calzado sneakers (Nike, Jordan, Yeezy, New Balance).

---

## 🚀 Tecnologías Principales

- **Frontend:** React 19 + Vite 8
- **Estilos:** Tailwind CSS v4 + Google Fonts (*Syne*, *Plus Jakarta Sans*, *Space Grotesk*)
- **Iconografía:** Lucide React + SVGs vectoriales de redes sociales
- **Enrutamiento:** React Router DOM v7 (SPA con rutas públicas y panel admin protegido)
- **Base de Datos & Backend:** PostgreSQL + Supabase (con soporte RLS y Storage para imágenes)
- **Modo Híbrido / Offline-First:** Funciona de inmediato con catálogo pre-cargado (las 43 gorras reales de la tienda) y persistencia en `localStorage`
- **Integración WhatsApp:** Generador automático de pedidos multilínea con formato internacional de Honduras (`+504 8876-1389`)
- **PWA & SEO:** Progressive Web App instalable con manifest, sitemap.xml, robots.txt y Open Graph tags

---

## 📦 Instalación y Ejecución Local

1. Clona el repositorio o abre la carpeta del proyecto:
   ```bash
   git clone https://github.com/olmanmart162005/KS-Store.git
   cd KS-Store
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en:
   ```text
   http://localhost:5173
   ```

---

## ⚙️ Variables de Entorno (`.env`)

Copia el archivo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Configura tus variables:

```env
# Supabase (Opcional: Si se dejan vacías, la app funciona en modo catálogo local autónomo)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Contacto Oficial de WhatsApp (Número de Honduras de 8 dígitos)
VITE_WHATSAPP_NUMBER=88761389

# Redes Sociales Oficiales
VITE_INSTAGRAM_URL=https://www.instagram.com/ks.store_hn
VITE_STORE_ADDRESS=Honduras
```

---

## 🗄️ Configuración de la Base de Datos (Supabase)

La base de datos de **Supabase (PostgreSQL)** es la fuente principal y permanente de los productos, categorías y ajustes de la tienda. Hemos incluido todos los scripts listos en la carpeta `database/`:

1. Ve a tu proyecto en [Supabase](https://supabase.com).
2. Entra a la sección **SQL Editor**.
3. Si estás instalando desde cero, ejecuta:
   - `database/schema.sql` (Crea tablas e índices de categorías, productos, tallas, colores, órdenes y perfiles)
   - `database/policies.sql` (Aplica políticas de seguridad RLS)
   - `database/storage.sql` (Crea y configura el bucket público `products` en Supabase Storage)
   - `database/seed.sql` (Inserta categorías y los 51 productos iniciales con las 43 fotos reales)
4. **Si ya tienes la base de datos creada**, ejecuta las migraciones seguras:
   - `database/migrations/001_fix_persistence_and_schema.sql` (Agrega columnas `model` y `attributes`, crea trigger `updated_at`, inserta los 8 modelos de tenis faltantes sin tocar tus gorras existentes, pobla tallas, confirma el correo del administrador y activa Supabase Realtime).
   - `database/migrations/002_orders_and_order_items.sql` (Configura `orders` y `order_items` para almacenar el historial de pedidos con instantánea histórica de precios e imágenes).
5. Agrega tu `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a tu archivo `.env`.

### Autenticación del Administrador en Supabase

Para que las políticas de seguridad RLS (`TO authenticated`) permitan guardar cambios permanentemente en PostgreSQL, debes iniciar sesión con un usuario registrado en **Supabase Authentication**:

1. En Supabase ve a **Authentication** > **Users**.
2. Utiliza tu cuenta oficial (`sauladmin@ksstore.org`) o crea un usuario administrador con **Auto Confirm User** activado.
3. El script `database/migrations/001_fix_persistence_and_schema.sql` se encarga automáticamente de confirmar el correo y asignarle `role = 'admin'` en la tabla `profiles`.

---

## 🛒 Flujo del Carrito, Reporte PDF A4 y Pedido por WhatsApp

El cliente disfruta de una experiencia fluida y transparente de pedido:
1. Navega por el catálogo o colecciones de gorras y tenis.
2. Selecciona su talla y color con validación previa.
3. Agrega productos al carrito con notificación Toast y sincronización automática si un precio cambia en tiempo real.
4. Revisa su carrito desde `/carrito` y modifica cantidades con actualización instantánea de subtotales.
5. Completa obligatoriamente su **nombre completo** y **número de celular** (más comentarios opcionales).
6. Al presionar **Enviar Pedido por WhatsApp** y confirmar:
   - El sistema verifica los precios actuales del catálogo sin descontar stock automáticamente y congela una instantánea histórica (`unit_price` e `image_url`) del pedido.
   - Se genera y descarga automáticamente un **documento PDF A4 vectorial real (`src/services/orderPdfService.js`)** sobre fondo blanco (`KS-STORE-PEDIDO-YYYYMMDD-XXX.pdf`) con texto seleccionable, logo oficial, tabla alineada con fotografías reales incrustadas de cada producto (soportando JPG, PNG y WebP con proporción original), importes alineados a la derecha, paginación multipágina con repetición de encabezados, nota legal y numeración de páginas.
   - Se abre WhatsApp con el resumen estructurado del pedido y se muestran instrucciones claras para adjuntar el archivo PDF recién descargado en el chat.

---

## 🛡️ Panel Administrativo (`/admin`)

Accediendo desde `/admin/login`:
- **Dashboard:** Estadísticas reales calculadas directamente desde la base de datos (total de productos, pedidos registrados, gorras, tenis, unidades en inventario, valor total del inventario en Lempiras, agotados y destacados).
- **Pedidos y reportes (`/admin/pedidos`):** Historial completo de pedidos generados desde el catálogo, búsqueda por número de pedido (`KS-YYYYMMDD-XXX`) o cliente, filtros por fecha y estado, vista detallada de productos con foto e importe histórico, regeneración/descarga del PDF A4 en cualquier momento y cambio de estado (`Pendiente de confirmación`, `Confirmado`, `En preparación`, `Entregado`, `Cancelado`).
- **Productos (`/admin/productos`):** CRUD completo (Ver detalles, Editar todos los campos sin restricciones, Duplicar y Eliminar productos con subida a Supabase Storage y validación estricta de respuesta de base de datos).
- **Gorras (`/admin/gorras`):** Gestión visual de gorras con edición rápida controlada de precios/stock y acceso al modal de edición completa.
- **Tenis (`/admin/tenis`):** Gestión completa de calzado, marcas, modelos, tallas y variantes.
- **Categorías (`/admin/categorias`):** Creación, edición y eliminación de categorías sincronizadas con Supabase.
- **Inventario (`/admin/inventario`):** Control rápido de existencias, alertas de bajo stock (`<= 3`), agotados y valorización por producto.
- **Configuración (`/admin/configuracion`):** Personalización permanente en Supabase de nombre de la tienda, número de WhatsApp, enlaces sociales, dirección y textos del Hero.

---

## 🚢 Deploy (Netlify o Vercel)

El proyecto viene preconfigurado para producción en ambas plataformas:

### Vercel
- Solo conecta tu repositorio en [Vercel](https://vercel.com).
- Se detectará automáticamente Vite. El archivo `vercel.json` se encarga del enrutamiento de la SPA.

### Netlify
- Conecta el repositorio en [Netlify](https://netlify.com).
- El archivo `netlify.toml` y `public/_redirects` manejan automáticamente el build y las redirecciones de rutas.

---

## 👤 Licencia y Créditos

Desarrollado para **KS Store** — *Estilo que te representa.*
Honduras 🇭🇳

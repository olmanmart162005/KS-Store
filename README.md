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
- **Integración WhatsApp:** Generador automático de pedidos multilínea con formato internacional de Honduras (`+504 89692971`)
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
VITE_WHATSAPP_NUMBER=89692971

# Redes Sociales Oficiales
VITE_INSTAGRAM_URL=https://www.instagram.com/ks.store_hn
VITE_STORE_ADDRESS=Honduras
```

---

## 🗄️ Configuración de la Base de Datos (Supabase)

Si deseas conectar el proyecto a la nube con Supabase, hemos incluido todos los scripts listos en la carpeta `database/`:

1. Ve a tu proyecto en [Supabase](https://supabase.com).
2. Entra a la sección **SQL Editor**.
3. Ejecuta los archivos en este orden:
   - `database/schema.sql` (Crea tablas e índices de categorías, productos, tallas, colores, órdenes y perfiles)
   - `database/policies.sql` (Aplica políticas de seguridad RLS)
   - `database/storage.sql` (Crea y configura el bucket público `products` en Supabase Storage)
   - `database/seed.sql` (Inserta categorías y los 51 productos iniciales con las 43 fotos reales)
4. Agrega tu `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a tu archivo `.env`.

### Cómo Crear tu Primer Usuario Administrador en Supabase

1. En Supabase ve a **Authentication** > **Users** > **Add user**.
2. Ingresa correo y contraseña (ejemplo: `admin@ksstore.com`).
3. Copia el `User UID` generado y ejecuta en el **SQL Editor**:
   ```sql
   INSERT INTO profiles (id, email, role)
   VALUES ('TU_USER_UID_AQUI', 'admin@ksstore.com', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

> **Nota:** La aplicación también incluye acceso administrativo maestro predeterminado para pruebas inmediatas:
> - **Correo:** `admin@ksstore.com`
> - **Contraseña:** `ksstore2026`

---

## 🛒 Flujo del Carrito y Pedido por WhatsApp

El cliente disfruta de una experiencia fluida de compra:
1. Navega por el catálogo o colecciones de gorras y tenis.
2. Selecciona su talla y color con validación previa.
3. Agrega productos al carrito con notificación Toast.
4. Puede revisar su carrito en cualquier momento desde el botón del Header o en `/carrito`.
5. Modifica cantidades con actualización instantánea de subtotales.
6. Opcionalmente completa su nombre y teléfono.
7. Al presionar **Enviar Pedido por WhatsApp**:
   - Se muestra un modal de resumen de confirmación con el código único del pedido (`KS-YYYYMMDD-XXX`).
   - Se abre WhatsApp con destino al número oficial **+504 89692971** con todos los productos desglosados en **un solo mensaje estructurado**.
   - Se limpia el carrito de forma segura y se muestra la pantalla de confirmación.

---

## 🛡️ Panel Administrativo (`/admin`)

Accediendo desde `/admin/login`:
- **Dashboard:** Métricas en tiempo real de productos totales, gorras, tenis, disponibilidad en stock y destacados.
- **Productos:** CRUD completo (Crear, Editar, Eliminar y Duplicar productos con carga de imágenes).
- **Gorras:** Gestión rápida visual de las 43 fotos de exhibición con edición inline de precios y stock.
- **Tenis:** Gestión abierta de cualquier marca de calzado, tallas y variantes.
- **Configuración:** Personalización del número de WhatsApp, enlaces sociales, banners y textos del Hero.

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

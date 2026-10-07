# Configuración de Base de Datos — KS Store (Supabase)

Este directorio contiene los scripts SQL completos y optimizados para ejecutar en el **SQL Editor de Supabase**.

## Pasos para Configurar en Supabase

1. Crea o ingresa a tu proyecto en [Supabase](https://supabase.com).
2. Dirígete a la sección **SQL Editor** en el menú lateral izquierdo.
3. Ejecuta los archivos en el siguiente orden:

### 1. `schema.sql`
Crea las tablas (`categories`, `products`, `product_images`, `product_sizes`, `product_colors`, `store_settings`, `orders`, `profiles`) e índices de alto rendimiento.

### 2. `policies.sql`
Aplica las políticas de seguridad **Row Level Security (RLS)**:
- Lectura pública para el catálogo y configuraciones de tienda.
- Inserción pública para los pedidos originados en la tienda.
- Operaciones de administración (crear, editar, eliminar productos) exclusivas para usuarios autenticados.

### 3. `storage.sql`
Configura el bucket de almacenamiento público `products` en Supabase Storage para alojar fotografías de productos con políticas de subida y lectura.

### 4. `seed.sql`
Inserta las categorías predeterminadas (`Gorras`, `Tenis`, `Moda Urbana`), la configuración de la tienda y los 51 productos iniciales (43 gorras con las fotos reales y 8 modelos de sneakers).

---

## Cómo Crear el Primer Administrador

1. En tu panel de Supabase, ve a **Authentication** > **Users**.
2. Haz clic en **Add user** > **Create user**.
3. Ingresa tu correo electrónico (ejemplo: `admin@ksstore.com`) y una contraseña segura.
4. Una vez creado el usuario, copia su `User UID`.
5. Ejecuta esta consulta en el **SQL Editor** reemplazando `'TU_UID_AQUI'` y el correo:

```sql
INSERT INTO profiles (id, email, role)
VALUES ('TU_UID_AQUI', 'admin@ksstore.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

6. ¡Listo! Ahora puedes ingresar en `/admin/login` con ese correo y contraseña.

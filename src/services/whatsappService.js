// ==============================================================================
// KS STORE - SERVICIO CENTRALIZADO DE WHATSAPP
// ==============================================================================

/**
 * Obtiene y formatea el número de WhatsApp de KS Store.
 * Utiliza la variable de entorno VITE_WHATSAPP_NUMBER o el número predeterminado.
 * Siempre garantiza el código de país de Honduras (504).
 */
export const getWhatsAppNumber = () => {
  const envNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '88761389';
  // Elimina caracteres no numéricos
  const cleanNumber = envNumber.replace(/\D/g, '');
  
  if (cleanNumber.startsWith('504')) {
    return cleanNumber;
  }
  return `504${cleanNumber}`;
};

/**
 * Obtiene el número con formato legible (+504 XXXX-XXXX)
 */
export const getDisplayWhatsAppNumber = () => {
  const raw = getWhatsAppNumber();
  const phone = raw.startsWith('504') ? raw.slice(3) : raw;
  if (phone.length === 8) {
    return `+504 ${phone.slice(0, 4)}-${phone.slice(4)}`;
  }
  return `+504 ${phone}`;
};

/**
 * Formatea un número a moneda Lempiras Hondureñas (L.)
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `L. ${num.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Genera un identificador único local para el pedido
 * Formato: KS-YYYYMMDD-XXX
 */
export const generateOrderCode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 dígitos
  return `KS-${year}${month}${day}-${randomSuffix}`;
};

/**
 * Convierte una ruta relativa de imagen a una URL absoluta pública accesible por WhatsApp
 */
export const getAbsoluteImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = 'https://ks-store-0606.vercel.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Convierte un slug de producto en una URL pública navegable
 */
export const getAbsoluteProductUrl = (slug) => {
  if (!slug) return '';
  return `https://ks-store-0606.vercel.app/producto/${slug}`;
};

/**
 * Verifica si el navegador soporta compartir archivos (fotos) nativamente (Android/iOS)
 */
export const canShareFiles = () => {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
};

/**
 * Construye el mensaje estructurado de WhatsApp para un pedido con múltiples productos y fotos
 */
export const generateWhatsAppOrderMessage = (cart, customerData = {}, orderCode = '') => {
  const code = orderCode || generateOrderCode();
  let message = `🔥 *NUEVO PEDIDO - KS STORE*\n`;
  message += `📋 *Código de Pedido:* ${code}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (customerData.name || customerData.phone || customerData.notes) {
    message += `👤 *DATOS DEL CLIENTE:*\n`;
    if (customerData.name) {
      message += `• *Nombre:* ${customerData.name.trim()}\n`;
    }
    if (customerData.phone) {
      message += `• *Teléfono:* ${customerData.phone.trim()}\n`;
    }
    if (customerData.notes) {
      message += `• *Dirección/Notas:* ${customerData.notes.trim()}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  } else {
    message += `\n`;
  }

  let total = 0;
  message += `🛒 *PRODUCTOS DEL PEDIDO (${cart.length}):*\n\n`;

  cart.forEach((item, index) => {
    const itemSubtotal = item.price * item.quantity;
    total += itemSubtotal;

    message += `*${index + 1}. ${item.name}*\n`;
    message += `   • Código SKU: ${item.sku || 'N/A'}\n`;
    if (item.size && item.size !== 'Unitalla' && item.size !== 'Ajustable / Unitalla') {
      message += `   • Talla: ${item.size}\n`;
    }
    if (item.color) {
      message += `   • Color: ${item.color}\n`;
    }
    message += `   • Cantidad: ${item.quantity} ud(s)\n`;
    message += `   • Precio: ${formatCurrency(item.price)}\n`;
    message += `   • Subtotal: ${formatCurrency(itemSubtotal)}\n`;
    
    // Enlace directo a la fotografía del producto en alta resolución
    if (item.main_image) {
      message += `   📸 *Foto del producto:* ${getAbsoluteImageUrl(item.main_image)}\n`;
    }
    if (item.slug) {
      message += `   🔗 *Ver en tienda:* ${getAbsoluteProductUrl(item.slug)}\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL A PAGAR: ${formatCurrency(total)}*\n\n`;
  message += `📍 *Ubicación:* Honduras\n`;
  message += `Quedo a la espera de la confirmación de disponibilidad para coordinar el pago y entrega.\n\n`;
  message += `¡Muchas gracias!`;

  return message;
};

/**
 * Construye un mensaje para consultar directamente un producto individual con su foto
 */
export const generateSingleProductMessage = (product, selectedSize = '', selectedColor = '') => {
  let message = `Hola KS Store, quiero consultar por este producto:\n\n`;
  message += `🔥 *${product.name}*\n`;
  message += `• Código SKU: ${product.sku || 'N/A'}\n`;
  message += `• Precio: ${formatCurrency(product.price)}\n`;
  
  const details = [];
  if (selectedSize && selectedSize !== 'Unitalla') {
    details.push(`Talla: ${selectedSize}`);
  }
  if (selectedColor) {
    details.push(`Color: ${selectedColor}`);
  }

  if (details.length > 0) {
    message += `• Detalle: ${details.join(', ')}\n`;
  }

  if (product.main_image) {
    message += `📸 *Foto del producto:* ${getAbsoluteImageUrl(product.main_image)}\n`;
  }
  if (product.slug) {
    message += `🔗 *Ver en tienda:* ${getAbsoluteProductUrl(product.slug)}\n`;
  }

  message += `\n¿Tienen disponibilidad para entrega o envío en Honduras?`;
  return message;
};

/**
 * Abre WhatsApp directamente con el pedido estructurado
 */
export const sendOrderToWhatsApp = (cart, customerData = {}, orderCode = '') => {
  const number = getWhatsAppNumber();
  const message = generateWhatsAppOrderMessage(cart, customerData, orderCode);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  return { success: true, orderCode, method: 'url' };
};

/**
 * Abre WhatsApp para consultar un producto individual
 */
export const sendProductQueryToWhatsApp = (product, selectedSize = '', selectedColor = '') => {
  const number = getWhatsAppNumber();
  const message = generateSingleProductMessage(product, selectedSize, selectedColor);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Envía el pedido intentando adjuntar la imagen del producto directamente mediante la API
 * nativa para compartir en dispositivos móviles (Web Share API).
 * Si no está disponible o falla, abre WhatsApp directamente con la URL de la foto incluida.
 */
export const sendOrderToWhatsAppWithMedia = async (cart, customerData = {}, orderCode = '') => {
  const code = orderCode || generateOrderCode();
  const message = generateWhatsAppOrderMessage(cart, customerData, code);

  // Intentar compartir con fotos en dispositivos móviles compatibles
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const filesToShare = [];
      const itemsToFetch = cart.filter((i) => Boolean(i.main_image)).slice(0, 4);

      for (const item of itemsToFetch) {
        try {
          const res = await fetch(item.main_image);
          if (res.ok) {
            const blob = await res.blob();
            const mimeType = blob.type || 'image/jpeg';
            const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
            const cleanName = (item.name || 'producto').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25);
            const fileName = `ks_${cleanName}_${Date.now()}.${ext}`;
            const file = new File([blob], fileName, { type: mimeType });
            filesToShare.push(file);
          }
        } catch (fetchErr) {
          console.warn('No se pudo convertir la imagen a archivo:', fetchErr);
        }
      }

      if (filesToShare.length > 0 && navigator.canShare({ files: filesToShare })) {
        await navigator.share({
          title: `Pedido KS Store - ${code}`,
          text: message,
          files: filesToShare,
        });
        return { success: true, method: 'share', orderCode: code };
      }
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') {
        // Usuario canceló explícitamente el modal de compartir
        return { success: false, aborted: true, orderCode: code };
      }
      console.warn('Fallo al compartir con archivos, recurriendo a enlace directo de WhatsApp:', shareErr);
    }
  }

  // Fallback seguro: Abrir WhatsApp con enlaces directos a las fotos en alta resolución
  return sendOrderToWhatsApp(cart, customerData, code);
};

/**
 * Consulta un producto individual intentando adjuntar su foto directamente
 */
export const sendProductQueryToWhatsAppWithMedia = async (product, selectedSize = '', selectedColor = '') => {
  const message = generateSingleProductMessage(product, selectedSize, selectedColor);

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && product.main_image) {
    try {
      const res = await fetch(product.main_image);
      if (res.ok) {
        const blob = await res.blob();
        const mimeType = blob.type || 'image/jpeg';
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const cleanName = (product.name || 'ks_producto').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25);
        const fileName = `ks_${cleanName}.${ext}`;
        const file = new File([blob], fileName, { type: mimeType });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `KS Store - ${product.name}`,
            text: message,
            files: [file],
          });
          return;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Fallback a WhatsApp link para consulta:', err);
    }
  }

  sendProductQueryToWhatsApp(product, selectedSize, selectedColor);
};

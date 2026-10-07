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
 * Construye el mensaje estructurado de WhatsApp para un pedido con múltiples productos
 */
export const generateWhatsAppOrderMessage = (cart, customerData = {}, orderCode = '') => {
  const code = orderCode || generateOrderCode();
  let message = `Hola KS Store, quiero realizar el siguiente pedido:\n\n`;
  message += `PEDIDO KS STORE\n`;
  message += `Número: ${code}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (customerData.name || customerData.phone) {
    if (customerData.name) {
      message += `Cliente: ${customerData.name.trim()}\n`;
    }
    if (customerData.phone) {
      message += `Teléfono: ${customerData.phone.trim()}\n`;
    }
    if (customerData.notes) {
      message += `Comentario: ${customerData.notes.trim()}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  } else {
    message += `\n`;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const itemSubtotal = item.price * item.quantity;
    total += itemSubtotal;

    message += `${index + 1}. ${item.name}\n`;
    message += `   Código: ${item.sku || 'N/A'}\n`;
    if (item.size && item.size !== 'Unitalla' && item.size !== 'Ajustable / Unitalla') {
      message += `   Talla: ${item.size}\n`;
    }
    if (item.color) {
      message += `   Color: ${item.color}\n`;
    }
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio: ${formatCurrency(item.price)}\n`;
    message += `   Subtotal: ${formatCurrency(itemSubtotal)}\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `TOTAL DEL PEDIDO: ${formatCurrency(total)}\n\n`;
  message += `Quedo pendiente para confirmar disponibilidad y detalles del pedido.\n\n`;
  message += `Gracias.`;

  return message;
};

/**
 * Construye un mensaje para consultar directamente un producto individual
 */
export const generateSingleProductMessage = (product, selectedSize = '', selectedColor = '') => {
  let message = `Hola KS Store, estoy interesado en el producto *${product.name}* (Código: ${product.sku || 'N/A'}), precio ${formatCurrency(product.price)}.`;
  
  const details = [];
  if (selectedSize && selectedSize !== 'Unitalla') {
    details.push(`Talla: ${selectedSize}`);
  }
  if (selectedColor) {
    details.push(`Color: ${selectedColor}`);
  }

  if (details.length > 0) {
    message += ` (${details.join(', ')})`;
  }

  message += ` ¿Está disponible?`;
  return message;
};

/**
 * Abre WhatsApp directamente con el pedido
 */
export const sendOrderToWhatsApp = (cart, customerData = {}, orderCode = '') => {
  const number = getWhatsAppNumber();
  const message = generateWhatsAppOrderMessage(cart, customerData, orderCode);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  return { success: true, orderCode };
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

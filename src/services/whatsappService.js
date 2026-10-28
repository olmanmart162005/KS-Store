// ==============================================================================
// KS STORE — SERVICIO CENTRALIZADO DE WHATSAPP Y FORMATO DE PEDIDOS
// ==============================================================================

/**
 * Obtiene y formatea el número de WhatsApp del encargado de KS Store.
 * Utiliza el número configurado en tienda, la variable VITE_WHATSAPP_NUMBER o el predeterminado.
 * Siempre garantiza el código de país de Honduras (504).
 */
export const getWhatsAppNumber = (customNumber = '') => {
  const rawSource =
    (typeof customNumber === 'string' && customNumber.trim()) ||
    import.meta.env.VITE_WHATSAPP_NUMBER ||
    '88761389';
  const cleanNumber = String(rawSource).replace(/\D/g, '');

  if (!cleanNumber) {
    return '50488761389';
  }
  if (cleanNumber.startsWith('504')) {
    return cleanNumber;
  }
  return `504${cleanNumber}`;
};

/**
 * Obtiene el número con formato legible (+504 XXXX-XXXX)
 */
export const getDisplayWhatsAppNumber = (customNumber = '') => {
  const raw = getWhatsAppNumber(customNumber);
  const phone = raw.startsWith('504') ? raw.slice(3) : raw;
  if (phone.length === 8) {
    return `+504 ${phone.slice(0, 4)}-${phone.slice(4)}`;
  }
  return `+504 ${phone}`;
};

/**
 * Formatea un número a moneda Lempiras Hondureñas (L. 3,799.00)
 */
export const formatCurrency = (amount) => {
  const num = Number(amount);
  const safeNum = Number.isFinite(num) ? num : 0;
  return `L. ${safeNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Genera un identificador único y seguro para el pedido evitando duplicados
 * Formato: KS-YYYYMMDD-XXX (ej: KS-20261025-001)
 */
export const generateOrderCode = (existingCodes = []) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  const existingSet = new Set(
    Array.isArray(existingCodes) ? existingCodes.map((c) => String(c).toUpperCase()) : []
  );

  // Secuencia incremental basada en pedidos previos del día o sufijo único de 3 dígitos
  let counter = 1;
  try {
    const storageKey = `ks_order_seq_${datePart}`;
    const prevSeq = parseInt(localStorage.getItem(storageKey) || '0', 10);
    counter = Number.isFinite(prevSeq) && prevSeq >= 1 ? prevSeq + 1 : 1;
    localStorage.setItem(storageKey, String(counter));
  } catch {
    counter = Math.floor(100 + Math.random() * 900);
  }

  let candidate = `KS-${datePart}-${String(counter).padStart(3, '0')}`;
  let attempts = 0;
  while (existingSet.has(candidate.toUpperCase()) && attempts < 50) {
    const rand = Math.floor(100 + Math.random() * 900);
    candidate = `KS-${datePart}-${rand}`;
    attempts++;
  }

  return candidate;
};

/**
 * Convierte una ruta relativa de imagen a una URL absoluta pública accesible
 */
export const getAbsoluteImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ks-store-0606.vercel.app';
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
 * Convierte un código de pedido en su enlace directo de factura PDF con fotos
 */
export const getPublicOrderReportUrl = (orderCode) => {
  if (!orderCode) return '';
  const baseUrl =
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://ks-store-0606.vercel.app';
  return `${baseUrl}/pedido/${encodeURIComponent(orderCode)}`;
};

/**
 * Construye el mensaje estructurado de WhatsApp para un pedido (con enlace directo al PDF)
 */
export const generateWhatsAppOrderMessage = (
  cart,
  customerData = {},
  orderCode = '',
  options = {}
) => {
  const code = orderCode || generateOrderCode();
  const pdfPublicUrl = options.pdfUrl || getPublicOrderReportUrl(code);

  let message = `Hola, KS Store. Quiero realizar el siguiente pedido.\n\n`;
  message += `*PEDIDO KS STORE*\n\n`;
  message += `Número: *${code}*\n`;

  if (customerData?.name?.trim()) {
    message += `Cliente: ${customerData.name.trim()}\n`;
  }
  if (customerData?.phone?.trim()) {
    message += `Teléfono: ${customerData.phone.trim()}\n`;
  }
  if (customerData?.notes?.trim()) {
    message += `Comentarios: ${customerData.notes.trim()}\n`;
  }

  message += `\n*Productos:*\n`;

  let total = 0;
  let totalUnits = 0;

  cart.forEach((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unit_price ?? item.price) || 0);
    const lineSubtotal = Number((unitPrice * qty).toFixed(2));
    total += lineSubtotal;
    totalUnits += qty;

    const details = [];
    if (item.sku) details.push(`código ${item.sku}`);
    if (item.size && item.size !== 'Unitalla' && item.size !== 'Ajustable / Unitalla') {
      details.push(`talla ${item.size}`);
    } else if (item.size) {
      details.push(`talla única`);
    }
    if (item.color) {
      details.push(`color ${item.color.toLowerCase()}`);
    }
    details.push(`cantidad ${qty}`);

    message += `- ${item.name}, ${details.join(', ')} (${formatCurrency(lineSubtotal)}).\n`;
  });

  message += `\nCantidad de productos: ${totalUnits} ${totalUnits === 1 ? 'unidad' : 'unidades'}\n`;
  message += `*Total estimado: ${formatCurrency(total)}.*\n\n`;

  if (pdfPublicUrl) {
    message += `📄 *Factura PDF del pedido (con fotos):*\n${pdfPublicUrl}`;
  }

  return message;
};

/**
 * Construye un mensaje profesional para consultar un producto individual
 */
export const generateSingleProductMessage = (product, selectedSize = '', selectedColor = '') => {
  let message = `Hola, KS Store. Me interesa consultar el siguiente producto:\n\n`;
  message += `*${product.name}*\n`;
  message += `Código: ${product.sku || 'N/A'}\n`;
  message += `Precio: *${formatCurrency(product.price)}*\n`;

  if (selectedSize && selectedSize !== 'Unitalla') {
    message += `Talla: ${selectedSize}\n`;
  }
  if (selectedColor) {
    message += `Color: ${selectedColor}\n`;
  }

  message += `\n¿Se encuentra disponible para entrega?`;
  return message;
};

/**
 * Construye la URL oficial wa.me con el número internacional de Honduras y el mensaje codificado
 */
export const buildWhatsAppOrderUrl = (
  cart,
  customerData = {},
  orderCode = '',
  options = {}
) => {
  const number = getWhatsAppNumber(options.whatsappNumber);
  const message = generateWhatsAppOrderMessage(cart, customerData, orderCode, options);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMessage}`;
};

/**
 * Abre WhatsApp directamente con el pedido estructurado
 */
export const sendOrderToWhatsApp = (
  cart,
  customerData = {},
  orderCode = '',
  options = {}
) => {
  const whatsappUrl = buildWhatsAppOrderUrl(cart, customerData, orderCode, options);
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  return { success: true, orderCode, whatsappUrl, method: 'url' };
};

/**
 * Abre WhatsApp para consultar un producto individual
 */
export const sendProductQueryToWhatsApp = (
  product,
  selectedSize = '',
  selectedColor = '',
  customNumber = ''
) => {
  const number = getWhatsAppNumber(customNumber);
  const message = generateSingleProductMessage(product, selectedSize, selectedColor);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

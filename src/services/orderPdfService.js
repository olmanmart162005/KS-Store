// ==============================================================================
// KS STORE — SERVICIO CENTRALIZADO DE FACTURAS Y REPORTES PDF DE PEDIDOS
// ==============================================================================
// Genera un documento PDF real en formato A4 (fondo blanco, texto seleccionable,
// tablas alineadas, paginación automática e imágenes reales incrustadas).

import { jsPDF } from 'jspdf';
import { formatCurrency } from './whatsappService.js';

const BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://ks-store-0606.vercel.app';

// Paleta corporativa en fondo blanco (inspirada en el logo oficial de KS Store)
const COLOR_BLACK = [9, 9, 11];       // #09090b - Negro corporativo
const COLOR_DARK = [24, 24, 27];      // #18181b - Texto principal
const COLOR_MUTED = [100, 100, 110];  // #64646e - Texto secundario
const COLOR_LIGHT_BG = [246, 246, 248]; // #f6f6f8 - Fondos suaves de celda
const COLOR_BORDER = [220, 220, 226]; // #dcdce2 - Bordes de tabla
const COLOR_WHITE = [255, 255, 255];  // #ffffff - Fondo blanco A4

export const ORDER_STATUS_LABELS = {
  pending: 'PENDIENTE DE CONFIRMACIÓN',
  confirmed: 'CONFIRMADO',
  preparing: 'EN PREPARACIÓN',
  delivered: 'ENTREGADO',
  cancelled: 'CANCELADO',
};

/**
 * Resuelve cualquier ruta de imagen (local o remota de Supabase/web) a URL absoluta
 */
const resolveImageUrl = (src) => {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('data:image/')) return src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const cleanPath = src.startsWith('/') ? src : `/${src}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Carga una imagen (JPEG, PNG o WebP) y la convierte a un DataURL JPEG/PNG
 * centrado proporcionalmente (object-fit: contain) sobre fondo blanco para
 * evitar deformaciones, recortes o errores con archivos WebP en visores PDF.
 */
const loadAndNormalizeImage = async (src, targetBoxPx = 240, preserveAlpha = false) => {
  if (!src) return null;
  const fullUrl = resolveImageUrl(src);

  try {
    let blobUrl = fullUrl;
    let revokeAfter = false;

    if (!fullUrl.startsWith('data:')) {
      const response = await fetch(fullUrl, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      revokeAfter = true;
    }

    const img = await new Promise((resolve, reject) => {
      const imageEl = new Image();
      imageEl.crossOrigin = 'anonymous';
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = (e) => reject(e);
      imageEl.src = blobUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetBoxPx;
    canvas.height = targetBoxPx;
    const ctx = canvas.getContext('2d');

    if (!preserveAlpha) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetBoxPx, targetBoxPx);
    } else {
      ctx.clearRect(0, 0, targetBoxPx, targetBoxPx);
    }

    const natW = img.naturalWidth || img.width || 1;
    const natH = img.naturalHeight || img.height || 1;
    const scale = Math.min(targetBoxPx / natW, targetBoxPx / natH);
    const drawW = natW * scale;
    const drawH = natH * scale;
    const offsetX = (targetBoxPx - drawW) / 2;
    const offsetY = (targetBoxPx - drawH) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    if (revokeAfter) {
      URL.revokeObjectURL(blobUrl);
    }

    const format = preserveAlpha ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(format, 0.92);
    return {
      dataUrl,
      format: preserveAlpha ? 'PNG' : 'JPEG',
      width: natW,
      height: natH,
    };
  } catch (err) {
    console.warn(`Aviso: No se pudo incrustar la imagen (${src}):`, err?.message || err);
    return null;
  }
};

/**
 * Dibuja una miniatura neutral cuando una imagen no está disponible
 */
const drawImagePlaceholder = (doc, x, y, sizeMm) => {
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.rect(x, y, sizeMm, sizeMm, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('KS STORE', x + sizeMm / 2, y + sizeMm / 2 - 1, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('Sin imagen', x + sizeMm / 2, y + sizeMm / 2 + 2.5, { align: 'center' });
};

/**
 * Normaliza el nombre del archivo PDF según el código del pedido
 * Ejemplo: KS-20261025-001 -> KS-STORE-PEDIDO-20261025-001.pdf
 */
export const getOrderPdfFileName = (orderCode = '') => {
  const cleanCode = String(orderCode || '')
    .trim()
    .replace(/^KS-/i, '');
  return `KS-STORE-PEDIDO-${cleanCode || Date.now()}.pdf`;
};

/**
 * Genera el documento PDF profesional A4 con texto seleccionable, tablas e imágenes reales.
 *
 * @param {Object} options
 * @param {Array}  options.items        - Lista de productos del pedido
 * @param {Object} options.customer     - { name, phone, notes }
 * @param {string} options.orderCode    - Código único (ej. KS-20261025-001)
 * @param {string} [options.createdAt]  - Fecha ISO del pedido
 * @param {string} [options.status]     - Estado del pedido ('pending', 'confirmed', etc.)
 * @param {number} [options.discount]   - Descuento si aplica
 * @param {number|null} [options.shippingCost] - Costo de envío si está definido
 * @param {boolean} [options.autoDownload=true] - Si debe iniciar la descarga automáticamente
 * @returns {Promise<{ doc: jsPDF, fileName: string, blob: Blob }>}
 */
export const createOrderPdfDocument = async ({
  items = [],
  customer = {},
  orderCode = '',
  createdAt = null,
  status = 'pending',
  discount = 0,
  shippingCost = null,
  autoDownload = true,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No se puede generar el reporte PDF porque el pedido no contiene productos.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_X = 14;
  const CONTENT_W = PAGE_W - MARGIN_X * 2; // 182 mm
  const FOOTER_LIMIT_Y = PAGE_H - 22;

  const dateObj = createdAt ? new Date(createdAt) : new Date();
  const formattedDate = dateObj.toLocaleDateString('es-HN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const statusText = ORDER_STATUS_LABELS[status] || String(status || 'PENDIENTE DE CONFIRMACIÓN').toUpperCase();

  // 1. Pre-cargar logo e imágenes de productos en paralelo antes de construir las páginas
  const [logoImg, ...productImages] = await Promise.all([
    loadAndNormalizeImage('/images/logo/logo.png', 200, true),
    ...items.map((item) =>
      loadAndNormalizeImage(item.main_image || item.image_url || '', 240, false)
    ),
  ]);

  // Fondo blanco explícito en página inicial
  const paintWhitePageBackground = () => {
    doc.setFillColor(...COLOR_WHITE);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  };

  paintWhitePageBackground();

  // ── SECCIÓN 1: ENCABEZADO CORPORATIVO ───────────────────────────────────────
  let cursorY = 14;

  // Logo oficial KS Store
  if (logoImg?.dataUrl) {
    try {
      doc.addImage(logoImg.dataUrl, logoImg.format, MARGIN_X, cursorY, 20, 20, undefined, 'FAST');
    } catch {
      // Continuar si el logo no pudo renderizarse
    }
  }

  const brandTextX = logoImg?.dataUrl ? MARGIN_X + 24 : MARGIN_X;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('KS STORE', brandTextX, cursorY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('CATÁLOGO DE MODA URBANA', brandTextX, cursorY + 13.5);

  // Bloque derecho: REPORTE DE PEDIDO y Metadatos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('REPORTE DE PEDIDO', PAGE_W - MARGIN_X, cursorY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`Número de pedido: ${orderCode}`, PAGE_W - MARGIN_X, cursorY + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Fecha y hora: ${formattedDate} · ${formattedTime}`, PAGE_W - MARGIN_X, cursorY + 16, {
    align: 'right',
  });

  // Badge de Estado
  const badgeText = `Estado: ${statusText}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const badgeW = doc.getTextWidth(badgeText) + 6;
  const badgeX = PAGE_W - MARGIN_X - badgeW;
  const badgeY = cursorY + 18.5;

  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(badgeX, badgeY, badgeW, 5.5, 1.2, 1.2, 'FD');
  doc.setTextColor(...COLOR_BLACK);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 3.8, { align: 'center' });

  cursorY += 28;

  // Línea divisoria superior
  doc.setDrawColor(...COLOR_BLACK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, cursorY, PAGE_W - MARGIN_X, cursorY);
  cursorY += 6;

  // ── SECCIÓN 2: DATOS DEL CLIENTE ────────────────────────────────────────────
  const clientName = customer?.name?.trim() || 'No especificado';
  const clientPhone = customer?.phone?.trim() || 'No especificado';
  const clientNotes = customer?.notes?.trim() || '';

  const notesLines = clientNotes
    ? doc.splitTextToSize(clientNotes, CONTENT_W - 42)
    : [];
  const clientBoxH = clientNotes ? 18 + Math.max(0, (notesLines.length - 1) * 4) : 13;

  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN_X, cursorY, CONTENT_W, clientBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('DATOS DEL CLIENTE', MARGIN_X + 4, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Cliente:', MARGIN_X + 4, cursorY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_DARK);
  doc.text(clientName, MARGIN_X + 18, cursorY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Teléfono:', MARGIN_X + 105, cursorY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_DARK);
  doc.text(clientPhone, MARGIN_X + 121, cursorY + 10);

  if (clientNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Comentarios:', MARGIN_X + 4, cursorY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_DARK);
    doc.text(notesLines, MARGIN_X + 26, cursorY + 15);
  }

  cursorY += clientBoxH + 6;

  // ── SECCIÓN 3: TABLA DE PRODUCTOS CON FOTOGRAFÍAS REALES ───────────────────
  // Definición de columnas (Suma total = 182mm):
  // Imagen (22mm) | Producto (54mm) | Código (22mm) | Talla (18mm) | Color (20mm) | Cant. (10mm) | Precio unitario (18mm) | Subtotal (18mm)
  const COL_X = {
    img: MARGIN_X,               // 14
    prod: MARGIN_X + 22,         // 36 (width 52)
    sku: MARGIN_X + 76,          // 90 (width 21)
    size: MARGIN_X + 98,         // 112 (width 18)
    color: MARGIN_X + 117,       // 131 (width 19)
    qty: MARGIN_X + 145,         // 159 (right-aligned)
    unitPrice: MARGIN_X + 163,   // 177 (right-aligned)
    subtotal: MARGIN_X + 180,    // 194 (right-aligned)
  };

  const drawTableHeader = (y) => {
    const headerH = 8;
    doc.setFillColor(...COLOR_BLACK);
    doc.rect(MARGIN_X, y, CONTENT_W, headerH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLOR_WHITE);

    const textY = y + 5.3;
    doc.text('Imagen', COL_X.img + 2, textY);
    doc.text('Producto', COL_X.prod, textY);
    doc.text('Código', COL_X.sku, textY);
    doc.text('Talla', COL_X.size, textY);
    doc.text('Color', COL_X.color, textY);
    doc.text('Cant.', COL_X.qty, textY, { align: 'right' });
    doc.text('Precio unit.', COL_X.unitPrice, textY, { align: 'right' });
    doc.text('Subtotal', COL_X.subtotal, textY, { align: 'right' });

    return y + headerH;
  };

  cursorY = drawTableHeader(cursorY);

  let totalUnits = 0;
  let productsSubtotal = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unit_price ?? item.price) || 0);
    const lineSubtotal = Number((unitPrice * qty).toFixed(2));

    totalUnits += qty;
    productsSubtotal += lineSubtotal;

    const prodName = String(item.name || 'Producto KS Store');
    const skuCode = String(item.sku || '—');
    const sizeText = String(
      item.size && item.size !== 'Ajustable / Unitalla' ? item.size : item.size ? 'Única' : 'Única'
    );
    const colorText = String(item.color || 'Estándar');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const nameLines = doc.splitTextToSize(prodName, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const colorLines = doc.splitTextToSize(colorText, 18);
    const sizeLines = doc.splitTextToSize(sizeText, 17);

    const textBlockH = Math.max(nameLines.length, colorLines.length, sizeLines.length) * 4 + 6;
    const rowH = Math.max(22, textBlockH);

    // Salto de página automático si la fila no cabe, repitiendo el encabezado
    if (cursorY + rowH > FOOTER_LIMIT_Y) {
      doc.addPage('a4', 'portrait');
      paintWhitePageBackground();
      cursorY = 16;
      cursorY = drawTableHeader(cursorY);
    }

    // Fondo alternado sutil
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(MARGIN_X, cursorY, CONTENT_W, rowH, 'F');
    }

    // Borde inferior e izquierdo/derecho de fila
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, cursorY + rowH, MARGIN_X + CONTENT_W, cursorY + rowH);

    // Miniatura de fotografía real (18x18 mm)
    const thumbSize = 18;
    const thumbX = COL_X.img + 1.5;
    const thumbY = cursorY + (rowH - thumbSize) / 2;
    const loadedImg = productImages[i];

    if (loadedImg?.dataUrl) {
      doc.setFillColor(...COLOR_WHITE);
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.2);
      doc.rect(thumbX, thumbY, thumbSize, thumbSize, 'FD');
      try {
        doc.addImage(
          loadedImg.dataUrl,
          loadedImg.format,
          thumbX + 0.4,
          thumbY + 0.4,
          thumbSize - 0.8,
          thumbSize - 0.8,
          undefined,
          'FAST'
        );
      } catch {
        drawImagePlaceholder(doc, thumbX, thumbY, thumbSize);
      }
    } else {
      drawImagePlaceholder(doc, thumbX, thumbY, thumbSize);
    }

    const rowTextY = cursorY + 6.5;

    // Nombre del producto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK);
    doc.text(nameLines, COL_X.prod, rowTextY);

    // Marca / Categoría debajo del nombre si existe
    if (item.brand) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(String(item.brand).toUpperCase(), COL_X.prod, rowTextY + nameLines.length * 3.8 + 0.5);
    }

    // Código / SKU
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text(skuCode, COL_X.sku, rowTextY);

    // Talla
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text(sizeLines, COL_X.size, rowTextY);

    // Color
    doc.text(colorLines, COL_X.color, rowTextY);

    // Cantidad (alineado a la derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(qty), COL_X.qty, rowTextY, { align: 'right' });

    // Precio unitario (alineado a la derecha)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(formatCurrency(unitPrice), COL_X.unitPrice, rowTextY, { align: 'right' });

    // Subtotal (alineado a la derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_BLACK);
    doc.text(formatCurrency(lineSubtotal), COL_X.subtotal, rowTextY, { align: 'right' });

    cursorY += rowH;
  }

  // ── SECCIÓN 4: RESUMEN ECONÓMICO Y OBSERVACIONES ────────────────────────────
  const validDiscount = Math.max(0, Number(discount) || 0);
  const validShipping =
    shippingCost !== null && shippingCost !== undefined && !Number.isNaN(Number(shippingCost))
      ? Math.max(0, Number(shippingCost))
      : null;

  const finalTotal = Math.max(
    0,
    Number((productsSubtotal - validDiscount + (validShipping || 0)).toFixed(2))
  );

  // Comprobar si el resumen económico y las observaciones caben en la página actual
  const summaryNeededH = 54;
  if (cursorY + summaryNeededH > FOOTER_LIMIT_Y) {
    doc.addPage('a4', 'portrait');
    paintWhitePageBackground();
    cursorY = 18;
  } else {
    cursorY += 6;
  }

  const summaryStartY = cursorY;

  // Columna Izquierda: Observaciones y Nota Legal
  const obsWidth = 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_BLACK);
  doc.text('OBSERVACIONES', MARGIN_X, summaryStartY + 4);

  let obsCursorY = summaryStartY + 8.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);

  if (clientNotes) {
    const obsClientLines = doc.splitTextToSize(`Comentarios del cliente: ${clientNotes}`, obsWidth);
    doc.text(obsClientLines, MARGIN_X, obsCursorY);
    obsCursorY += obsClientLines.length * 3.8 + 2.5;
  } else {
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Comentarios del cliente: Sin comentarios adicionales.', MARGIN_X, obsCursorY);
    obsCursorY += 5.5;
  }

  const legalNote =
    '«Este documento es un reporte de pedido generado desde el catálogo digital de KS Store. No constituye comprobante de pago ni factura fiscal. Los precios, la disponibilidad y las condiciones de entrega están sujetos a confirmación por parte de KS Store».';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLOR_MUTED);
  const legalLines = doc.splitTextToSize(legalNote, obsWidth);
  doc.text(legalLines, MARGIN_X, obsCursorY);

  // Columna Derecha: Cuadro de Resumen Económico
  const boxW = 76;
  const boxX = PAGE_W - MARGIN_X - boxW;
  let boxY = summaryStartY;

  const summaryRows = [
    { label: 'Cantidad total de unidades:', value: `${totalUnits}` },
    { label: 'Subtotal de productos:', value: formatCurrency(productsSubtotal) },
  ];

  if (validDiscount > 0) {
    summaryRows.push({ label: 'Descuento:', value: `- ${formatCurrency(validDiscount)}` });
  }

  summaryRows.push({
    label: 'Envío:',
    value: validShipping !== null ? formatCurrency(validShipping) : 'Pendiente de confirmación',
  });

  const boxH = summaryRows.length * 6 + 14;
  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.5, 1.5, 'FD');

  let rowY = boxY + 6;
  summaryRows.forEach((r) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(r.label, boxX + 3.5, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text(r.value, boxX + boxW - 3.5, rowY, { align: 'right' });
    rowY += 6;
  });

  // Barra final de TOTAL DEL PEDIDO
  const totalBarY = boxY + boxH - 9;
  doc.setFillColor(...COLOR_BLACK);
  doc.roundedRect(boxX, totalBarY, boxW, 9, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_WHITE);
  doc.text('TOTAL DEL PEDIDO:', boxX + 3.5, totalBarY + 6);

  doc.setFontSize(9.5);
  doc.text(formatCurrency(finalTotal), boxX + boxW - 3.5, totalBarY + 6, { align: 'right' });

  // ── SECCIÓN 5: PIE DE PÁGINA CON NUMERACIÓN EN TODAS LAS PÁGINAS ────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerLineY = PAGE_H - 14;

    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X, footerLineY, PAGE_W - MARGIN_X, footerLineY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('KS STORE · Reporte de pedido generado digitalmente.', MARGIN_X, footerLineY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Pedido: ${orderCode} · Página ${p} de ${totalPages}`,
      PAGE_W - MARGIN_X,
      footerLineY + 5,
      { align: 'right' }
    );
  }

  const fileName = getOrderPdfFileName(orderCode);
  const blob = doc.output('blob');

  if (autoDownload) {
    doc.save(fileName);
  }

  return { doc, fileName, blob, totalAmount: finalTotal, totalUnits };
};

/**
 * Función principal compatible con llamadas directas desde el Carrito o el Panel Admin
 */
export const generateOrderPDF = async (cartOrItems, customerData = {}, orderCode = '', options = {}) => {
  return createOrderPdfDocument({
    items: cartOrItems,
    customer: customerData,
    orderCode,
    createdAt: options.createdAt || null,
    status: options.status || 'pending',
    discount: options.discount || 0,
    shippingCost: options.shippingCost ?? null,
    autoDownload: options.autoDownload !== false,
  });
};

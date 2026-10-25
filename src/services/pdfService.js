// ==============================================================================
// KS STORE — SERVICIO DE GENERACIÓN DE PDF DE PEDIDO
// ==============================================================================
import { jsPDF } from 'jspdf';
import { formatCurrency } from './whatsappService';

const BASE_URL = 'https://ks-store-0606.vercel.app';
const PRIMARY   = [9, 9, 11];      // zinc-950
const ACCENT    = [225, 29, 72];   // rose-600
const WHITE     = [255, 255, 255];
const LIGHT_BG  = [245, 245, 247]; // zinc-100
const BORDER    = [228, 228, 231]; // zinc-200
const TEXT_DARK = [24, 24, 27];    // zinc-900
const TEXT_MID  = [113, 113, 122]; // zinc-500

/**
 * Convierte una ruta de imagen (relativa o absoluta) en base64 para incrustarla en el PDF.
 * Si falla, retorna null para mostrar un placeholder.
 */
const fetchImageAsBase64 = async (src) => {
  try {
    const url = src.startsWith('http') ? src : `${BASE_URL}${src}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Carga el logo de KS Store como base64
 */
const fetchLogo = () => fetchImageAsBase64('/images/logo/logo.png');

/**
 * Dibuja una celda de color relleno
 */
const fillRect = (doc, x, y, w, h, color) => {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
};

/**
 * Genera y descarga automáticamente el PDF profesional del pedido KS Store.
 * @param {Array}  cart         - Ítems del carrito
 * @param {Object} customerData - { name, phone, notes }
 * @param {string} orderCode    - Código del pedido
 */
export const generateOrderPDF = async (cart, customerData = {}, orderCode = '') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210; // page width mm
  const ML = 15; // margin left
  const MR = 15; // margin right
  const CW = PW - ML - MR; // content width

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-HN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── HEADER ────────────────────────────────────────────────────────────────
  fillRect(doc, 0, 0, PW, 38, PRIMARY);

  // Logo
  const logoB64 = await fetchLogo();
  if (logoB64) {
    // Logo sobre fondo blanco circular (simulado con rect)
    fillRect(doc, ML, 6, 24, 24, WHITE);
    doc.addImage(logoB64, 'PNG', ML + 1, 7, 22, 22);
  }

  // Store name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text('KS STORE', ML + 28, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.text('Gorras y Sneakers — Honduras', ML + 28, 22);

  // Badge "CONFIRMACIÓN DE PEDIDO"
  fillRect(doc, PW - MR - 55, 8, 55, 10, ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('CONFIRMACIÓN DE PEDIDO', PW - MR - 52.5, 14.2);

  // Order code & date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(212, 212, 216); // zinc-300
  doc.text(`Código: ${orderCode}`, PW - MR - 55, 23);
  doc.text(`Fecha: ${dateStr}`, PW - MR - 55, 27.5);

  // ── DATOS DEL CLIENTE ─────────────────────────────────────────────────────
  let cy = 46;

  if (customerData.name || customerData.phone || customerData.notes) {
    fillRect(doc, ML, cy, CW, 7, LIGHT_BG);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text('DATOS DE CONTACTO', ML + 3, cy + 4.8);
    cy += 9;

    const fields = [];
    if (customerData.name)  fields.push({ label: 'Nombre:', value: customerData.name });
    if (customerData.phone) fields.push({ label: 'Teléfono:', value: customerData.phone });
    if (customerData.notes) fields.push({ label: 'Dirección / Notas:', value: customerData.notes });

    fields.forEach((f) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_MID);
      doc.text(f.label, ML + 3, cy);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_DARK);
      doc.text(String(f.value), ML + 38, cy);
      cy += 5.5;
    });

    cy += 3;
  }

  // ── TABLA DE PRODUCTOS ────────────────────────────────────────────────────
  // Encabezado tabla
  fillRect(doc, ML, cy, CW, 8, PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);

  const COL_IMG  = ML;
  const COL_DET  = ML + 22;
  const COL_SKU  = ML + 100;
  const COL_CANT = ML + 122;
  const COL_PU   = ML + 138;
  const COL_SUB  = ML + 160;

  doc.text('Foto',         COL_IMG + 2,  cy + 5.2);
  doc.text('Producto',     COL_DET,      cy + 5.2);
  doc.text('SKU',          COL_SKU,      cy + 5.2);
  doc.text('Cant.',        COL_CANT,     cy + 5.2);
  doc.text('Precio',       COL_PU,       cy + 5.2);
  doc.text('Subtotal',     COL_SUB,      cy + 5.2);
  cy += 9;

  let total = 0;

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const ROW_H = 26;
    const rowBg = i % 2 === 0 ? WHITE : [250, 250, 252];
    fillRect(doc, ML, cy, CW, ROW_H, rowBg);

    // Borde inferior fila
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(ML, cy + ROW_H, ML + CW, cy + ROW_H);

    // Imagen del producto
    const imgB64 = await fetchImageAsBase64(item.main_image);
    if (imgB64) {
      // Marco blanco
      fillRect(doc, COL_IMG + 1, cy + 1, 19, 24, WHITE);
      doc.setDrawColor(...BORDER);
      doc.rect(COL_IMG + 1, cy + 1, 19, 24);
      try {
        doc.addImage(imgB64, 'JPEG', COL_IMG + 1.5, cy + 1.5, 18, 23, undefined, 'FAST');
      } catch {
        // Si no se puede cargar, dejar en blanco
      }
    } else {
      // Placeholder gris
      fillRect(doc, COL_IMG + 1, cy + 1, 19, 24, LIGHT_BG);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...TEXT_MID);
      doc.text('Sin foto', COL_IMG + 4, cy + 14);
    }

    // Nombre producto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    const nameLines = doc.splitTextToSize(item.name, 76);
    doc.text(nameLines, COL_DET, cy + 7);

    // Talla / Color
    let detailY = cy + 7 + nameLines.length * 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MID);
    if (item.size && item.size !== 'Unitalla' && item.size !== 'Ajustable / Unitalla') {
      doc.text(`Talla: ${item.size}`, COL_DET, detailY);
      detailY += 3.5;
    }
    if (item.color) {
      doc.text(`Color: ${item.color}`, COL_DET, detailY);
    }

    // SKU
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_DARK);
    doc.text(item.sku || '—', COL_SKU, cy + 7);

    // Cantidad
    doc.text(String(item.quantity), COL_CANT + 3, cy + 7, { align: 'center' });

    // Precio unitario
    doc.text(formatCurrency(item.price), COL_PU, cy + 7);

    // Subtotal (negrita)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(formatCurrency(subtotal), COL_SUB, cy + 7);

    cy += ROW_H;
  }

  // ── TOTAL ─────────────────────────────────────────────────────────────────
  cy += 4;
  fillRect(doc, ML + CW - 70, cy, 70, 12, PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL A PAGAR:', ML + CW - 67, cy + 7.5);
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text(formatCurrency(total), ML + CW - 3, cy + 7.5, { align: 'right' });

  // Nota envío
  cy += 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MID);
  doc.text('* El costo de envío se coordina directamente por WhatsApp.', ML, cy);

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = 277;
  fillRect(doc, 0, footerY, PW, 20, PRIMARY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('KS Store', ML, footerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  doc.text('Gorras y Sneakers — Honduras', ML, footerY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('ks-store-0606.vercel.app', PW / 2, footerY + 7, { align: 'center' });

  doc.setTextColor(...ACCENT);
  doc.text('@ks.store_hn', PW / 2, footerY + 12, { align: 'center' });

  doc.setTextColor(161, 161, 170);
  doc.text(`Pedido: ${orderCode}`, PW - MR, footerY + 7, { align: 'right' });
  doc.text(`${dateStr}`, PW - MR, footerY + 12, { align: 'right' });

  // ── DESCARGAR ─────────────────────────────────────────────────────────────
  doc.save(`KS-Store-Pedido-${orderCode}.pdf`);
};

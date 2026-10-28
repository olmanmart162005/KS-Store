import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useProducts } from '../../context/ProductsContext';
import { formatCurrency } from '../../services/whatsappService';
import {
  generateOrderPDF,
  getOrderPdfFileName,
  ORDER_STATUS_LABELS,
} from '../../services/orderPdfService';

export const OrderReport = () => {
  const { orderCode } = useParams();
  const { orders } = useProducts();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const autoDownloadTriggeredRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      setLoading(true);
      try {
        const cleanCode = String(orderCode || '').trim();
        let found = null;

        if (isSupabaseConfigured && supabase && cleanCode) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .ilike('order_code', cleanCode)
            .maybeSingle();

          if (!error && data) {
            found = data;
          }
        }

        if (!found && Array.isArray(orders)) {
          found = orders.find(
            (o) => String(o.order_code || '').toLowerCase() === cleanCode.toLowerCase()
          );
        }

        if (active) {
          setOrder(found || null);
        }
      } catch (err) {
        console.error('Error cargando reporte de pedido:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      active = false;
    };
  }, [orderCode, orders]);

  // Descargar automáticamente el PDF A4 con fotos al abrir el enlace desde WhatsApp
  useEffect(() => {
    if (!order || autoDownloadTriggeredRef.current) return;
    autoDownloadTriggeredRef.current = true;

    const triggerPdf = async () => {
      try {
        setDownloading(true);
        const items = Array.isArray(order.items) ? order.items : [];
        if (items.length === 0) return;

        await generateOrderPDF(
          items,
          {
            name: order.customer_name,
            phone: order.customer_phone,
            notes: order.customer_notes,
          },
          order.order_code,
          {
            createdAt: order.created_at,
            status: order.status || 'pending',
            autoDownload: true,
          }
        );
        setAutoDownloaded(true);
      } catch (err) {
        console.warn('Aviso al autodescargar PDF:', err);
      } finally {
        setDownloading(false);
      }
    };

    triggerPdf();
  }, [order]);

  const handleManualDownload = async () => {
    if (!order || downloading) return;
    try {
      setDownloading(true);
      await generateOrderPDF(
        order.items || [],
        {
          name: order.customer_name,
          phone: order.customer_phone,
          notes: order.customer_notes,
        },
        order.order_code,
        {
          createdAt: order.created_at,
          status: order.status || 'pending',
          autoDownload: true,
        }
      );
      setAutoDownloaded(true);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2 className="w-9 h-9 text-white animate-spin" />
        <p className="text-sm font-bold text-white">Cargando reporte oficial del pedido...</p>
        <p className="text-xs text-zinc-400">Generando documento PDF A4 con fotografías...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white font-heading">
          Pedido no encontrado ({orderCode})
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Verifica que el código del pedido sea correcto o regresa al catálogo de KS Store.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-extrabold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ir al Catálogo</span>
        </Link>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const statusLabel = ORDER_STATUS_LABELS[order.status] || 'PENDIENTE DE CONFIRMACIÓN';
  const pdfFileName = getOrderPdfFileName(order.order_code);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Barra superior de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center shrink-0">
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-extrabold text-white uppercase tracking-wider">
              {downloading
                ? 'Generando PDF con fotografías...'
                : autoDownloaded
                ? `PDF descargado (${pdfFileName})`
                : `Reporte Oficial ${order.order_code}`}
            </p>
            <p className="text-[11px] text-zinc-400">
              Documento comercial A4 con fotografías reales de los productos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualDownload}
            disabled={downloading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generando...' : 'Descargar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hoja Comercial Blanca (Estilo A4 idéntico al PDF) */}
      <div className="bg-white text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden p-6 sm:p-10 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-zinc-900">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo/logo.png"
              alt="KS Store"
              className="w-16 h-16 object-contain rounded-xl border border-zinc-200 p-1 bg-white"
            />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">KS STORE</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Catálogo de Moda Urbana
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Reporte de Pedido
              </span>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="text-xs font-bold text-zinc-500 uppercase">Número de Pedido</div>
            <div className="text-lg font-black font-mono text-zinc-950">{order.order_code}</div>
            <div className="text-xs text-zinc-600">
              {order.created_at
                ? new Date(order.created_at).toLocaleString('es-HN')
                : new Date().toLocaleString('es-HN')}
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Cliente</span>
            <span className="font-bold text-zinc-900 text-sm">
              {order.customer_name || 'No especificado'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Teléfono</span>
            <span className="font-bold text-zinc-900 text-sm">
              {order.customer_phone || 'No especificado'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Comentarios</span>
            <span className="text-zinc-700">
              {order.customer_notes || 'Sin comentarios adicionales'}
            </span>
          </div>
        </div>

        {/* Tabla de Productos con Fotografías */}
        <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Imagen</th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Talla</th>
                <th className="py-3 px-3">Color</th>
                <th className="py-3 px-3 text-right">Cant.</th>
                <th className="py-3 px-3 text-right">Precio Unit.</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((item, idx) => {
                const qty = Math.max(1, Number(item.quantity) || 1);
                const unitPrice = Number(item.unit_price ?? item.price) || 0;
                const lineSubtotal = Number(item.subtotal ?? unitPrice * qty);
                const imgUrl = item.main_image || item.image_url;

                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-zinc-50/70' : 'bg-white'}>
                    <td className="py-2.5 px-3">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-14 h-14 object-contain rounded-lg border border-zinc-200 bg-white p-0.5"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400 font-bold">
                          SIN FOTO
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-900">{item.name}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600">{item.sku || '—'}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{item.size || 'Única'}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{item.color || 'Estándar'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-900">{qty}</td>
                    <td className="py-2.5 px-3 text-right text-zinc-700">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-zinc-950">
                      {formatCurrency(lineSubtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumen Económico */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          <div className="max-w-md text-[11px] text-zinc-500 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
            <strong className="text-zinc-700 block mb-1 uppercase text-[10px]">Nota Legal:</strong>
            Este documento es un reporte de pedido generado desde el catálogo digital de KS Store.
            No constituye comprobante de pago ni factura fiscal. Los precios, la disponibilidad y
            las condiciones de entrega están sujetos a confirmación por parte de KS Store.
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
            <div className="flex justify-between text-zinc-600">
              <span>Total de unidades:</span>
              <span className="font-bold text-zinc-900">{totalUnits}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal productos:</span>
              <span className="font-bold text-zinc-900">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Envío:</span>
              <span className="italic text-zinc-500">Pendiente de confirmación</span>
            </div>
            <div className="pt-2 border-t border-zinc-300 flex justify-between items-baseline">
              <span className="font-black text-zinc-950 uppercase">Total Pedido:</span>
              <span className="text-lg font-black text-rose-600">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

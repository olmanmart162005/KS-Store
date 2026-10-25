import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
  X,
  User,
  Phone,
  MessageSquare,
  Loader2,
  Filter,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../services/whatsappService';
import { generateOrderPDF, ORDER_STATUS_LABELS } from '../../services/orderPdfService';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente de confirmación',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
    icon: CheckCircle2,
  },
  preparing: {
    label: 'En preparación',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    icon: PackageCheck,
  },
  delivered: {
    label: 'Entregado',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    icon: Truck,
  },
  cancelled: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    icon: XCircle,
  },
};

export const OrdersAdmin = () => {
  const { orders, updateOrderStatus, refreshCatalog } = useProducts();
  const { showToast } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7days', 'month', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estadísticas reales de pedidos
  const stats = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const total = list.length;
    const pending = list.filter((o) => !o.status || o.status === 'pending').length;
    const active = list.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length;
    const delivered = list.filter((o) => o.status === 'delivered').length;
    return { total, pending, active, delivered };
  }, [orders]);

  // Filtrado por número de pedido/cliente, estado y fecha
  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return list.filter((order) => {
      // 1. Búsqueda por código, cliente o teléfono
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = order.order_code?.toLowerCase().includes(q);
        const nameMatch = order.customer_name?.toLowerCase().includes(q);
        const phoneMatch = order.customer_phone?.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !phoneMatch) return false;
      }

      // 2. Filtro por estado
      const currentStatus = order.status || 'pending';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      // 3. Filtro por fecha
      if (dateFilter !== 'all' && order.created_at) {
        const orderDate = new Date(order.created_at);
        if (dateFilter === 'today') {
          if (orderDate < startOfToday) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          if (
            orderDate.getMonth() !== now.getMonth() ||
            orderDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (dateFilter === 'custom' && customDate) {
          const yyyy = orderDate.getFullYear();
          const mm = String(orderDate.getMonth() + 1).padStart(2, '0');
          const dd = String(orderDate.getDate()).padStart(2, '0');
          const formattedOrderDate = `${yyyy}-${mm}-${dd}`;
          if (formattedOrderDate !== customDate) return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilter, customDate]);

  // Regenerar y descargar el PDF histórico de un pedido conservando precios y fotos originales
  const handleDownloadOrderPdf = async (order) => {
    if (!order || downloadingId) return;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) {
      showToast('Este pedido no contiene productos para generar el PDF.', 'error');
      return;
    }

    setDownloadingId(order.id || order.order_code);
    try {
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
      showToast(`Reporte PDF ${order.order_code} descargado correctamente`, 'success');
    } catch (err) {
      showToast(err.message || 'No se pudo generar el PDF del pedido.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Actualizar estado real del pedido en Supabase
  const handleStatusChange = async (order, newStatus) => {
    if (!order || updatingStatusId) return;
    const key = order.id || order.order_code;
    setUpdatingStatusId(key);
    try {
      const updated = await updateOrderStatus(key, newStatus);
      if (selectedOrder && (selectedOrder.id === order.id || selectedOrder.order_code === order.order_code)) {
        setSelectedOrder(updated);
      }
      showToast(
        `Estado actualizado a "${STATUS_CONFIG[newStatus]?.label || newStatus}"`,
        'success'
      );
    } catch (err) {
      showToast(
        err.message || 'No se pudo actualizar el estado del pedido.',
        'error'
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCatalog(false);
      showToast('Historial de pedidos sincronizado', 'info');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} · ${d.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Gestión de Cotizaciones y PDF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Pedidos y Reportes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Consulta pedidos generados, descarga sus reportes PDF oficiales con fotografías y actualiza su estado
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Total de Pedidos
          </span>
          <span className="text-2xl font-extrabold text-white font-heading mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
            Pendientes de Confirmación
          </span>
          <span className="text-2xl font-extrabold text-white font-heading mt-1 block">
            {stats.pending}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
            Confirmados / En Preparación
          </span>
          <span className="text-2xl font-extrabold text-white font-heading mt-1 block">
            {stats.active}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            Entregados
          </span>
          <span className="text-2xl font-extrabold text-white font-heading mt-1 block">
            {stats.delivered}
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador por Número de Pedido, Cliente o Teléfono */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número (ej. KS-20261025-001), cliente o teléfono..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente de confirmación</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">En preparación</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div className="md:col-span-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500 shrink-0 hidden sm:block" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="7days">Últimos 7 días</option>
              <option value="month">Este mes</option>
              <option value="custom">Fecha específica...</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs text-zinc-400 font-semibold">Seleccionar fecha:</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white"
            />
          </div>
        )}
      </div>

      {/* Listado de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron pedidos</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Los pedidos confirmados desde el carrito de la tienda aparecerán aquí con su copia histórica de precios, fotografías y reporte PDF descargable.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800 overflow-hidden shadow-xl">
          {/* Tabla Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4">Pedido</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Productos</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones / PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 text-xs">
                {filteredOrders.map((order) => {
                  const key = order.id || order.order_code;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const totalUnits = items.reduce(
                    (acc, item) => acc + (Number(item.quantity) || 1),
                    0
                  );
                  const currentStatus = order.status || 'pending';
                  const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
                  const isDownloading = downloadingId === key;
                  const isUpdating = updatingStatusId === key;

                  return (
                    <tr key={key} className="hover:bg-zinc-900/90 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {order.order_code}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-100">
                          {order.customer_name || 'No especificado'}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {order.customer_phone || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {items.slice(0, 3).map((it, idx) => (
                              <img
                                key={idx}
                                src={it.main_image || it.image_url || '/images/logo/logo.png'}
                                alt={it.name}
                                className="w-8 h-8 rounded-lg object-cover border border-zinc-700 bg-zinc-950"
                              />
                            ))}
                          </div>
                          <span className="text-zinc-300 font-semibold">
                            {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-white whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={currentStatus}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${statusCfg.badgeClass}`}
                        >
                          <option value="pending" className="bg-zinc-900 text-white">
                            Pendiente de confirmación
                          </option>
                          <option value="confirmed" className="bg-zinc-900 text-white">
                            Confirmado
                          </option>
                          <option value="preparing" className="bg-zinc-900 text-white">
                            En preparación
                          </option>
                          <option value="delivered" className="bg-zinc-900 text-white">
                            Entregado
                          </option>
                          <option value="cancelled" className="bg-zinc-900 text-white">
                            Cancelado
                          </option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ver detalle del pedido"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadOrderPdf(order)}
                            disabled={isDownloading}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Descargar reporte PDF con fotografías"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista de Tarjetas en Móvil */}
          <div className="md:hidden divide-y divide-zinc-800">
            {filteredOrders.map((order) => {
              const key = order.id || order.order_code;
              const items = Array.isArray(order.items) ? order.items : [];
              const totalUnits = items.reduce(
                (acc, item) => acc + (Number(item.quantity) || 1),
                0
              );
              const currentStatus = order.status || 'pending';
              const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
              const isDownloading = downloadingId === key;

              return (
                <div key={key} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-extrabold text-sm text-white block">
                        {order.order_code}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatDateTime(order.created_at)}
                      </span>
                    </div>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-0.5">
                    <p>
                      <strong className="text-zinc-400">Cliente:</strong>{' '}
                      {order.customer_name || 'No especificado'}
                    </p>
                    <p>
                      <strong className="text-zinc-400">Teléfono:</strong>{' '}
                      {order.customer_phone || '—'}
                    </p>
                    <p>
                      <strong className="text-zinc-400">Artículos:</strong> {totalUnits}{' '}
                      {totalUnits === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${statusCfg.badgeClass}`}
                    >
                      <option value="pending" className="bg-zinc-900 text-white">
                        Pendiente de confirmación
                      </option>
                      <option value="confirmed" className="bg-zinc-900 text-white">
                        Confirmado
                      </option>
                      <option value="preparing" className="bg-zinc-900 text-white">
                        En preparación
                      </option>
                      <option value="delivered" className="bg-zinc-900 text-white">
                        Entregado
                      </option>
                      <option value="cancelled" className="bg-zinc-900 text-white">
                        Cancelado
                      </option>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadOrderPdf(order)}
                        disabled={isDownloading}
                        className="py-2 px-3 rounded-xl bg-white text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Descargar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo del Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Cabecera del Modal */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-950/60">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block">
                  Reporte de Pedido Digital
                </span>
                <h2 className="text-xl font-extrabold text-white font-heading">
                  {selectedOrder.order_code}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Generado: {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Datos del cliente y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 block text-[11px]">
                    Datos del Cliente
                  </span>
                  <p className="text-zinc-200 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      <strong>Nombre:</strong> {selectedOrder.customer_name || 'No especificado'}
                    </span>
                  </p>
                  <p className="text-zinc-200 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      <strong>Teléfono:</strong> {selectedOrder.customer_phone || 'No especificado'}
                    </span>
                  </p>
                  {selectedOrder.customer_notes && (
                    <p className="text-zinc-300 pt-1 border-t border-zinc-800/80">
                      <strong className="text-zinc-400">Comentarios:</strong>{' '}
                      {selectedOrder.customer_notes}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 block text-[11px]">
                    Estado del Pedido
                  </span>
                  <select
                    value={selectedOrder.status || 'pending'}
                    onChange={(e) => handleStatusChange(selectedOrder, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs focus:outline-none focus:border-white"
                  >
                    <option value="pending">Pendiente de confirmación</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">En preparación</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <p className="text-[11px] text-zinc-500">
                    {ORDER_STATUS_LABELS[selectedOrder.status || 'pending']}
                  </p>
                </div>
              </div>

              {/* Tabla de Productos con Fotografías Históricas */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                  Productos del Pedido ({(selectedOrder.items || []).length})
                </h3>

                <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
                  <div className="divide-y divide-zinc-800/80">
                    {(selectedOrder.items || []).map((item, idx) => {
                      const qty = Math.max(1, Number(item.quantity) || 1);
                      const unitPrice = Number(item.unit_price ?? item.price) || 0;
                      const lineSubtotal = Number((unitPrice * qty).toFixed(2));

                      return (
                        <div
                          key={idx}
                          className="p-3.5 flex items-center justify-between gap-4 hover:bg-zinc-900/50"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={item.main_image || item.image_url || '/images/logo/logo.png'}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-white truncate">
                                {item.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                {item.sku && <span className="font-mono">Código: {item.sku}</span>}
                                {item.size && <span>• Talla: {item.size}</span>}
                                {item.color && <span>• Color: {item.color}</span>}
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {qty} x {formatCurrency(unitPrice)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-extrabold text-white">
                              {formatCurrency(lineSubtotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Total del Pedido
                    </span>
                    <span className="text-lg font-black text-white">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleDownloadOrderPdf(selectedOrder)}
                disabled={Boolean(downloadingId)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Generar y Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

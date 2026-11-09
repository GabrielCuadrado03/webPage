import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../config/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  runTransaction, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Button from '../../components/Button';
import { getPlaceholderImage } from '../../utils/placeholders';
import { 
  ShieldAlert, 
  Users, 
  Package, 
  Layers, 
  ShoppingBag, 
  LogOut,
  Database,
  Lock,
  Unlock,
  LayoutDashboard,
  FileText,
  Check,
  X,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  History,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Image,
  Upload,
  Link as LinkIcon,
  Tag,
  Eye,
  Percent,
  CheckSquare,
  Square,
  Search
} from 'lucide-react';

// Componente premium de Collage de Imágenes para Combos en el ERP
const ComboImageCollage = ({ productIds, products, defaultImageUrl, className = "" }) => {
  const images = (productIds || [])
    .map(pid => {
      const p = products.find(prod => prod.id === pid);
      return p?.imageUrl || null;
    })
    .filter(Boolean);

  const uniqueImages = [...new Set(images)];

  if (uniqueImages.length === 0) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img 
          src={defaultImageUrl || getPlaceholderImage('Combo')} 
          alt="Combo default" 
          className="w-full h-full object-cover opacity-75"
        />
      </div>
    );
  }

  if (uniqueImages.length === 1) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
        <img 
          src={uniqueImages[0]} 
          alt="Combo single product" 
          className="w-full h-full object-cover opacity-75"
        />
      </div>
    );
  }

  if (uniqueImages.length === 2) {
    return (
      <div className={`w-full h-full grid grid-cols-2 gap-[1px] bg-slate-800 relative ${className}`}>
        {uniqueImages.slice(0, 2).map((img, idx) => (
          <img 
            key={idx} 
            src={img} 
            alt={`Combo product ${idx + 1}`} 
            className="w-full h-full object-cover opacity-75"
          />
        ))}
      </div>
    );
  }

  if (uniqueImages.length === 3) {
    return (
      <div className={`w-full h-full grid grid-cols-3 gap-[1px] bg-slate-800 relative ${className}`}>
        <div className="col-span-2 h-full w-full">
          <img 
            src={uniqueImages[0]} 
            alt="Combo product 1" 
            className="w-full h-full object-cover opacity-75"
          />
        </div>
        <div className="grid grid-rows-2 gap-[1px] h-full w-full">
          <img 
            src={uniqueImages[1]} 
            alt="Combo product 2" 
            className="w-full h-full object-cover opacity-75"
          />
          <img 
            src={uniqueImages[2]} 
            alt="Combo product 3" 
            className="w-full h-full object-cover opacity-75"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px] bg-slate-800 relative ${className}`}>
      {uniqueImages.slice(0, 4).map((img, idx) => (
        <img 
          key={idx} 
          src={img} 
          alt={`Combo product ${idx + 1}`} 
          className="w-full h-full object-cover opacity-75"
        />
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // --- Estados de Navegación Interna ERP ---
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'orders', 'products', 'combos', 'banners', 'categories'

  // --- Estados de Datos Reales en Tiempo Real ---
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // --- Estados de Gráficos y Finanzas ---
  const [chartRange, setChartRange] = useState('7days'); // '7days', '30days'
  const [activePointIndex, setActivePointIndex] = useState(null);

  // Estados de carga de datos
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // --- Estados de Formularios y Modales CRUD ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null para crear, producto para editar
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    userDiscount: '0',
    stock: '',
    imageUrl: '',
    categoryId: '',
    isFeatured: false,
    isAvailable: true
  });

  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    specialPrice: '',
    imageUrl: '',
    isAvailable: true,
    productIds: [] // Array de strings (IDs de productos incluidos)
  });

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    linkText: 'Ver Más',
    linkUrl: '/products'
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: '', // slug único manual
    name: '',
    imageUrl: ''
  });

  // --- Estados de Gestión de Inventario ---
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    action: 'add', // 'add' (agregar) o 'subtract' (retirar)
    amount: '',
    reason: 'Compra/Ingreso de mercadería'
  });

  // Estados de Carga e Interacción de Archivos
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id de la orden u objeto operando
  const [expandedOrders, setExpandedOrders] = useState({});
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [ordersSubTab, setOrdersSubTab] = useState('active'); // 'active' o 'history'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (err) {
      console.error("Error al cerrar sesión ERP:", err);
    }
  };

  const openStockAdjustment = (prod) => {
    if (!prod) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setStockAdjustmentProduct(prod);
    setStockForm({
      action: 'add',
      amount: '',
      reason: 'Compra/Ingreso de mercadería'
    });
    setShowStockModal(true);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const { action, amount, reason } = stockForm;
    if (!amount.trim()) {
      setErrorMsg("Por favor ingresa la cantidad de unidades.");
      return;
    }

    const qty = parseInt(amount);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Por favor ingresa una cantidad numérica válida mayor a 0.");
      return;
    }

    const change = action === 'add' ? qty : -qty;
    const oldStock = stockAdjustmentProduct.stock;
    const newStock = oldStock + change;

    if (newStock < 0) {
      setErrorMsg("El stock resultante no puede ser negativo.");
      return;
    }

    try {
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
      const productRef = doc(db, 'products', stockAdjustmentProduct.id);

      await runTransaction(db, async (transaction) => {
        const prodSnap = await transaction.get(productRef);
        if (!prodSnap.exists()) {
          throw new Error("El producto ya no existe.");
        }
        
        // Actualizar stock
        transaction.update(productRef, { 
          stock: newStock,
          isAvailable: newStock > 0 ? stockAdjustmentProduct.isAvailable : false
        });
      });

      // Crear log de auditoría
      await addDoc(collection(db, 'inventory_logs'), {
        productId: stockAdjustmentProduct.id,
        productName: stockAdjustmentProduct.name,
        changeAmount: change,
        previousStock: oldStock,
        newStock: newStock,
        adjustedBy: adminName,
        timestamp: serverTimestamp(),
        reason: reason.trim() || 'Ajuste manual del Administrador'
      });

      setSuccessMsg(`Inventario de "${stockAdjustmentProduct.name}" ajustado con éxito (${change > 0 ? '+' : ''}${change} un. / Nuevo stock: ${newStock} un.).`);
      setShowStockModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al ajustar el inventario.");
    }
  };

  // --- Utilidades Financieras ERP ---
  const getOrderDate = (order) => {
    if (!order?.createdAt) return new Date();
    if (typeof order.createdAt.toDate === 'function') {
      return order.createdAt.toDate();
    }
    if (order.createdAt instanceof Date) {
      return order.createdAt;
    }
    if (order.createdAt.seconds) {
      return new Date(order.createdAt.seconds * 1000);
    }
    const d = new Date(order.createdAt);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Cálculos de Ganancias por Períodos Temporales
  const getPeriodEarnings = (daysLimit) => {
    const now = new Date();
    // Para diario: desde las 00:00:00 de hoy
    if (daysLimit === 0) {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return (orders || []).filter(o => {
        if (!o || (o.status !== 'completado' && o.status !== 'confirmado' && o.status !== 'entregado')) return false;
        const oDate = getOrderDate(o);
        return oDate >= startOfToday;
      }).reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
    }
    
    // Para semanal/mensual: límite exacto en milisegundos
    const startTime = now.getTime() - (daysLimit * 24 * 60 * 60 * 1000);
    const startDate = new Date(startTime);
    return (orders || []).filter(o => {
      if (!o || (o.status !== 'completado' && o.status !== 'confirmado' && o.status !== 'entregado')) return false;
      const oDate = getOrderDate(o);
      return oDate >= startDate;
    }).reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
  };

  const dailyEarnings = getPeriodEarnings(0);
  const weeklyEarnings = getPeriodEarnings(7);
  const monthlyEarnings = getPeriodEarnings(30);

  // Obtener historial de facturación por días para el gráfico
  const getDailyEarningsRange = (rangeType) => {
    const limit = rangeType === '30days' ? 30 : 7;
    const days = [];
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateLabel: limit === 30 
          ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) 
          : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        dateStr: d.toDateString(),
        earnings: 0
      });
    }

    (orders || [])
      .filter(o => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado')
      .forEach(o => {
        const oDate = getOrderDate(o);
        const oDateStr = oDate.toDateString();
        const match = days.find(day => day.dateStr === oDateStr);
        if (match) {
          match.earnings += (o?.totalAmount || 0);
        }
      });

    return days;
  };

  // Obtener los 5 productos que generan más ingresos (Facturación bruta)
  const getTopRevenueProducts = () => {
    const salesMap = {};
    (orders || [])
      .filter(o => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado')
      .forEach(o => {
        (o?.items || []).forEach(item => {
          if (!item) return;
          const key = item.productId || item.name || 'desconocido';
          if (!salesMap[key]) {
            salesMap[key] = {
              id: item.productId || '',
              name: item.name || 'Artículo',
              quantity: 0,
              revenue: 0,
              isCombo: !!item.isCombo
            };
          }
          salesMap[key].quantity += (item.quantity || 1);
          salesMap[key].revenue += ((item.quantity || 1) * (item.price || 0));
        });
      });

    return Object.values(salesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // --- Pipeline de Generación XML a PDF ---
  const generateXmlReport = () => {
    const today = new Date().toLocaleDateString('es-CO');
    const rentables = getTopRevenueProducts();
    const completedOrdersList = (orders || []).filter(o => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado');
    const totalCompleted = completedOrdersList.length;
    const transferenciaCount = completedOrdersList.filter(o => o?.paymentMethod === 'transferencia' || o?.paymentMethod === 'whatsapp').length;
    const efectivoCount = completedOrdersList.filter(o => o?.paymentMethod === 'efectivo' || (o?.paymentMethod !== 'transferencia' && o?.paymentMethod !== 'whatsapp')).length;
    const totalEarnings = completedOrdersList.reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
    const avgTicket = totalCompleted > 0 ? (totalEarnings / totalCompleted) : 0;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<reporte>\n`;
    xml += `  <fecha_emision>${today}</fecha_emision>\n`;
    xml += `  <compania>ETHEREAL VAPES</compania>\n`;
    xml += `  <periodo>Mensual (Últimos 30 días)</periodo>\n`;
    
    xml += `  <finanzas>\n`;
    xml += `    <ganancias_hoy>${dailyEarnings.toFixed(2)}</ganancias_hoy>\n`;
    xml += `    <ganancias_semana>${weeklyEarnings.toFixed(2)}</ganancias_semana>\n`;
    xml += `    <ganancias_mes>${monthlyEarnings.toFixed(2)}</ganancias_mes>\n`;
    xml += `    <ganancias_historicas>${totalEarnings.toFixed(2)}</ganancias_historicas>\n`;
    xml += `    <total_ventas>${totalCompleted}</total_ventas>\n`;
    xml += `    <ticket_promedio>${avgTicket.toFixed(2)}</ticket_promedio>\n`;
    xml += `    <pagos_transferencia>${transferenciaCount}</pagos_transferencia>\n`;
    xml += `    <pagos_efectivo>${efectivoCount}</pagos_efectivo>\n`;
    xml += `  </finanzas>\n`;

    xml += `  <productos_rentables>\n`;
    rentables.forEach(p => {
      xml += `    <producto>\n`;
      xml += `      <nombre>${p.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</nombre>\n`;
      xml += `      <unidades>${p.quantity}</unidades>\n`;
      xml += `      <ingresos>${p.revenue.toFixed(2)}</ingresos>\n`;
      xml += `      <tipo>${p.isCombo ? 'Combo' : 'Producto'}</tipo>\n`;
      xml += `    </producto>\n`;
    });
    xml += `  </productos_rentables>\n`;
    
    xml += `</reporte>`;
    return xml;
  };

  const handlePrintPdfFromXml = () => {
    try {
      const xmlString = generateXmlReport();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Validar XML
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("Error parsing generated XML document");
      }

      // Leer datos del XML
      const fecha = xmlDoc.getElementsByTagName("fecha_emision")[0]?.textContent || '';
      const compania = xmlDoc.getElementsByTagName("compania")[0]?.textContent || '';
      const periodo = xmlDoc.getElementsByTagName("periodo")[0]?.textContent || '';

      const ganHoy = xmlDoc.getElementsByTagName("ganancias_hoy")[0]?.textContent || '0.00';
      const ganSemana = xmlDoc.getElementsByTagName("ganancias_semana")[0]?.textContent || '0.00';
      const ganMes = xmlDoc.getElementsByTagName("ganancias_mes")[0]?.textContent || '0.00';
      const ganHist = xmlDoc.getElementsByTagName("ganancias_historicas")[0]?.textContent || '0.00';

      const totalVentas = xmlDoc.getElementsByTagName("total_ventas")[0]?.textContent || '0';
      const ticketPromedio = xmlDoc.getElementsByTagName("ticket_promedio")[0]?.textContent || '0.00';
      const pagosTransferencia = xmlDoc.getElementsByTagName("pagos_transferencia")[0]?.textContent || xmlDoc.getElementsByTagName("pagos_whatsapp")[0]?.textContent || '0';
      const pagosEfectivo = xmlDoc.getElementsByTagName("pagos_efectivo")[0]?.textContent || '0';

      const xmlProductos = xmlDoc.getElementsByTagName("producto");
      let productosHtml = '';

      // Iterar sobre nodos de producto del XML
      for (let i = 0; i < xmlProductos.length; i++) {
        const prodNode = xmlProductos[i];
        const nombre = prodNode.getElementsByTagName("nombre")[0]?.textContent || '';
        const unidades = prodNode.getElementsByTagName("unidades")[0]?.textContent || '0';
        const ingresos = prodNode.getElementsByTagName("ingresos")[0]?.textContent || '0.00';
        const tipo = prodNode.getElementsByTagName("tipo")[0]?.textContent || 'Producto';
        const unitPrice = parseFloat(unidades) > 0 ? (parseFloat(ingresos) / parseFloat(unidades)).toFixed(2) : '0.00';

        productosHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: bold;">${nombre}</td>
            <td style="padding: 10px; text-transform: uppercase; font-size: 10px; color: #6d28d9; font-weight: bold;">${tipo}</td>
            <td style="padding: 10px; text-align: center; font-family: monospace;">$${unitPrice}</td>
            <td style="padding: 10px; text-align: center;">${unidades} un.</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #047857;">$${parseFloat(ingresos).toFixed(2)}</td>
          </tr>
        `;
      }

      // Estructura HTML para la ventana de impresión
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Por favor, permite las ventanas emergentes (pop-ups) para generar el PDF.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte Financiero Mensual - ${compania}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
              background-color: #ffffff;
            }
            .header-table {
              width: 100%;
              border-bottom: 3px solid #6d28d9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 26px;
              font-weight: 900;
              color: #1e1b4b;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: 1px;
            }
            .meta {
              font-size: 11px;
              color: #64748b;
              text-align: right;
              font-weight: bold;
              text-transform: uppercase;
            }
            .kpi-container {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 35px;
            }
            .kpi-card {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .kpi-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 5px;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
              font-family: monospace;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 15px;
              letter-spacing: 0.5px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            .data-table th {
              background-color: #f1f5f9;
              padding: 10px;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 9px;
              color: #475569;
              border-bottom: 2px solid #cbd5e1;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              font-weight: bold;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 0; }
              @page { size: portrait; margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="title">${compania}</h1>
                <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #6d28d9;">REPORTE DE RENDIMIENTO FINANCIERO</p>
              </td>
              <td class="meta">
                Periodo: ${periodo}<br>
                Emisión: ${fecha}<br>
                Estado: OFICIAL
              </td>
            </tr>
          </table>

          <h2 class="section-title">Resumen de Caja General</h2>
          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-title" style="color: #6d28d9;">Cierre Diario</div>
              <div class="kpi-value">$${parseFloat(ganHoy).toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title" style="color: #4338ca;">Semanal (7d)</div>
              <div class="kpi-value">$${parseFloat(ganSemana).toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title" style="color: #be185d;">Mensual (30d)</div>
              <div class="kpi-value">$${parseFloat(ganMes).toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title" style="color: #047857;">Histórico Total</div>
              <div class="kpi-value" style="color: #047857;">$${parseFloat(ganHist).toFixed(2)}</div>
            </div>
          </div>

          <h2 class="section-title">Desglose Operativo y Canales de Venta</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th style="text-align: left;">Métrica / Distribución Comercial</th>
                <th style="text-align: right; width: 250px;">Valor Registrado</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Volumen de Transacciones Exitosas</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${totalVentas} órdenes completadas</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Ticket Promedio (Venta Media por Orden)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #4338ca;">$${parseFloat(ticketPromedio).toFixed(2)} por pedido</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Pedidos cobrados vía Transferencia (WhatsApp)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${pagosTransferencia} órdenes</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Pedidos cobrados en Efectivo (Local/Entrega)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${pagosEfectivo} órdenes</td>
              </tr>
            </tbody>
          </table>

          <h2 class="section-title">Top Productos con Mayor Facturación</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th style="text-align: left;">Descripción del Artículo</th>
                <th style="text-align: left; width: 80px;">Clase</th>
                <th style="text-align: center; width: 110px;">Precio de Venta</th>
                <th style="text-align: center; width: 110px;">Cantidad Vendida</th>
                <th style="text-align: right; width: 140px;">Facturación Bruta</th>
              </tr>
            </thead>
            <tbody>
              ${productosHtml || '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #94a3b8;">No se registran ventas en este periodo.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Este reporte fue generado de manera automática por el sistema de facturación y control de inventarios ERP de ${compania}.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al generar el reporte XML / PDF: " + err.message);
    }
  };

  // Métricas reactivas (Defensivas contra nulos)
  const metrics = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(o => o?.status === 'pendiente')?.length || 0,
    completedOrders: orders?.filter(o => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado')?.length || 0,
    totalProducts: products?.length || 0,
    totalCombos: combos?.length || 0,
    totalCategories: categories?.length || 0,
    totalBanners: banners?.length || 0,
    totalUsers: users?.length || 0,
    totalEarnings: (orders || []).filter(o => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado').reduce((acc, o) => acc + (o?.totalAmount || 0), 0)
  };

  // Helper para verificar la disponibilidad detallada del combo y sus componentes
  const getComboAvailabilityStatus = (combo) => {
    const issues = [];
    let isOutOfStock = false;
    
    (combo?.productIds || []).forEach(pid => {
      const p = products.find(prod => prod?.id === pid);
      if (!p) {
        issues.push({ name: `Producto ID ${pid}`, type: 'no_encontrado' });
        isOutOfStock = true;
      } else if (p.isAvailable === false) {
        issues.push({ name: p.name, type: 'no_disponible' });
        isOutOfStock = true;
      } else if (p.stock <= 0) {
        issues.push({ name: p.name, type: 'sin_stock', stock: 0 });
        isOutOfStock = true;
      } else if (p.stock < 5) {
        issues.push({ name: p.name, type: 'stock_bajo', stock: p.stock });
      }
    });

    return {
      isOutOfStock: isOutOfStock || combo?.isAvailable === false,
      issues: issues
    };
  };

  // Obtener los 5 productos más vendidos de órdenes completadas
  const getTopSellingProducts = () => {
    const salesMap = {};
    (orders || [])
      .filter(o => o?.status === 'completado')
      .forEach(o => {
        (o?.items || []).forEach(item => {
          if (!item) return;
          const key = item.productId || item.name || 'desconocido';
          if (!salesMap[key]) {
            salesMap[key] = {
              id: item.productId || '',
              name: item.name || 'Artículo',
              quantity: 0,
              revenue: 0,
              isCombo: !!item.isCombo
            };
          }
          salesMap[key].quantity += (item.quantity || 1);
          salesMap[key].revenue += ((item.quantity || 1) * (item.price || 0));
        });
      });

    return Object.values(salesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // No mock fallback databases definitions

  // ========================================================
  // 📡 LISTENERS EN TIEMPO REAL CON FIRESTORE
  // ========================================================

  // 1. Pedidos
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const ordersList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          ordersList.push({
            id: doc.id,
            ...data,
            createdAtFormatted: data.createdAt?.toDate()?.toLocaleString('es-CO') || 'Fecha cargando...',
          });
        }
      });
      
      setOrders(ordersList);
      setLoadingOrders(false);
    }, (error) => {
      console.warn("Firestore orders listen error:", error);
      setOrders([]);
      setLoadingOrders(false);
    });

    return () => unsub();
  }, []);

  // 2. Productos (Con Parseo de Tipos ultra-seguro compatible con Flutter y dependencias limpias)
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          prodList.push({
            id: doc.id,
            name: data.name || 'Producto sin nombre',
            description: data.description || '',
            price: typeof data.price === 'number' ? data.price : parseFloat(data.price?.toString()) || 0.0,
            userDiscount: typeof data.userDiscount === 'number' ? data.userDiscount : parseFloat(data.userDiscount?.toString()) || 0.0,
            stock: typeof data.stock === 'number' ? data.stock : parseInt(data.stock?.toString()) || 0,
            imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Producto'),
            categoryId: data.categoryId || 'default',
            isFeatured: !!data.isFeatured,
            isAvailable: data.isAvailable !== false
          });
        }
      });
      
      setProducts(prodList);
      setLoadingProducts(false);
    }, (error) => {
      console.warn("Firestore products listen error:", error);
      setProducts([]);
      setLoadingProducts(false);
    });

    return () => unsub();
  }, []); // Array de dependencias vacío para prevenir bucles de actualización

  // 3. Combos
  useEffect(() => {
    const q = query(collection(db, 'combos'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const combosList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          combosList.push({
            id: doc.id,
            name: data.name || 'Combo Promocional',
            description: data.description || '',
            specialPrice: typeof data.specialPrice === 'number' ? data.specialPrice : parseFloat(data.specialPrice?.toString()) || 0.0,
            imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Combo'),
            productIds: Array.isArray(data.productIds) ? Array.from(data.productIds) : [],
            isAvailable: data.isAvailable !== false
          });
        }
      });
      
      setCombos(combosList);
      setLoadingCombos(false);
    }, (error) => {
      console.warn("Firestore combos listen error:", error);
      setCombos([]);
      setLoadingCombos(false);
    });

    return () => unsub();
  }, []);

  // 4. Categorías
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const catList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          catList.push({
            id: doc.id,
            name: data.name || 'Categoría',
            imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Categoría')
          });
        }
      });
      
      setCategories(catList);
      setLoadingCategories(false);
    }, (error) => {
      console.warn("Firestore categories listen error:", error);
      setCategories([]);
      setLoadingCategories(false);
    });

    return () => unsub();
  }, []);

  // 5. Banners
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('title', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const bannersList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          bannersList.push({
            id: doc.id,
            title: data.title || 'Campaña',
            subtitle: data.subtitle || '',
            description: data.description || '',
            imageUrl: data.imageUrl || getPlaceholderImage(data.title || 'Banner'),
            linkText: data.linkText || 'Ver Más',
            linkUrl: data.linkUrl || '/products'
          });
        }
      });
      
      setBanners(bannersList);
      setLoadingBanners(false);
    }, (error) => {
      console.warn("Firestore banners listen error:", error);
      setBanners([]);
      setLoadingBanners(false);
    });

    return () => unsub();
  }, []);

  // 6. Logs de Inventario
  useEffect(() => {
    const q = query(collection(db, 'inventory_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const logsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          logsList.push({
            id: doc.id,
            ...data,
            timestampFormatted: data.timestamp?.toDate()?.toLocaleString('es-CO') || 'Justo ahora'
          });
        }
      });
      
      setInventoryLogs(logsList);
      setLoadingLogs(false);
    }, (error) => {
      console.warn("Firestore inventory logs error:", error);
      setInventoryLogs([]);
      setLoadingLogs(false);
    });

    return () => unsub();
  }, []);

  // 7. Usuarios (Conteo reactivo)
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          usersList.push({
            id: doc.id,
            email: data.email || 'N/A',
            role: data.role || 'usuario',
            displayName: data.displayName || 'Usuario Ethereal',
            createdAtFormatted: data.createdAt?.toDate()?.toLocaleDateString('es-CO') || 'N/A'
          });
        }
      });
      const mockUsers = [
        { id: 'user-mock-1', displayName: 'Enrique Cuadrado', email: 'enrique@ethereal.com', role: 'admin', createdAtFormatted: '1/6/2026' },
        { id: 'user-mock-2', displayName: 'Gabriel José', email: 'gabriel@ethereal.com', role: 'premium', createdAtFormatted: '1/6/2026' }
      ];
      if (usersList.length > 0) {
        setUsers(usersList);
      } else {
        setUsers(mockUsers);
      }
      setLoadingUsers(false);
    }, (error) => {
      console.warn("Firestore users error, usando mock de respaldo:", error);
      const mockUsers = [
        { id: 'user-mock-1', displayName: 'Enrique Cuadrado', email: 'enrique@ethereal.com', role: 'admin', createdAtFormatted: '1/6/2026' },
        { id: 'user-mock-2', displayName: 'Gabriel José', email: 'gabriel@ethereal.com', role: 'premium', createdAtFormatted: '1/6/2026' }
      ];
      setUsers(mockUsers);
      setLoadingUsers(false);
    });

    return () => unsub();
  }, []);

  // ========================================================
  // ⚙️ SUBIDA HÍBRIDA DE IMÁGENES A FIREBASE STORAGE
  // ========================================================
  const handleImageUpload = async (e, setImageUrlCallback) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploadingImage(true);

    try {
      const fileRef = ref(storage, `catalog/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      
      setImageUrlCallback(downloadUrl);
      setSuccessMsg("¡Archivo subido exitosamente a Firebase Storage!");
    } catch (err) {
      console.error("Storage upload error:", err);
      setErrorMsg("No se pudo subir la foto a Firebase Storage. Verifica las reglas de Storage o pega directamente una URL de red.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ========================================================
  // ⚙️ OPERACIONES DE PEDIDOS (LÓGICA TRANSACCIONAL DE STOCK DE LA FASE 2)
  // ========================================================
  const confirmOrder = async (order) => {
    if (!order || order.status !== 'pendiente') return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(order.id);

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await transaction.get(orderRef);
        
        if (!orderSnap.exists()) {
          throw new Error("El pedido no existe.");
        }
        if (orderSnap.data().status !== 'pendiente') {
          throw new Error("Este pedido ya ha sido procesado.");
        }

        const stockDeductions = {};

        for (const item of (order.items || [])) {
          if (!item) continue;
          const qty = item.quantity || 1;

          if (item.isCombo) {
            const productIds = item.productIds || [];
            productIds.forEach((pid) => {
              if (pid) {
                stockDeductions[pid] = (stockDeductions[pid] || 0) + qty;
              }
            });
          } else {
            const pid = item.productId;
            if (pid) {
              stockDeductions[pid] = (stockDeductions[pid] || 0) + qty;
            }
          }
        }

        const productSnapshots = {};
        for (const pid of Object.keys(stockDeductions)) {
          const productRef = doc(db, 'products', pid);
          const productSnap = await transaction.get(productRef);
          
          if (!productSnap.exists()) {
            throw new Error(`El producto con ID '${pid}' no existe en el catálogo.`);
          }
          productSnapshots[pid] = { snap: productSnap, ref: productRef };
        }

        const validationErrors = [];
        for (const pid of Object.keys(stockDeductions)) {
          const requiredQty = stockDeductions[pid];
          const productData = productSnapshots[pid].snap.data();
          const currentStock = typeof productData.stock === 'number' ? productData.stock : 0;
          const productName = productData.name || 'Producto Desconocido';

          if (currentStock < requiredQty) {
            validationErrors.push(`"${productName}" (Disponible: ${currentStock}, Requerido: ${requiredQty})`);
          }
        }

        if (validationErrors.length > 0) {
          throw new Error(`Stock insuficiente para procesar la orden:\n- ${validationErrors.join('\n- ')}`);
        }

        const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
        const batchLogs = [];

        for (const pid of Object.keys(stockDeductions)) {
          const deductQty = stockDeductions[pid];
          const productRef = productSnapshots[pid].ref;
          const productData = productSnapshots[pid].snap.data();
          
          const oldStock = typeof productData.stock === 'number' ? productData.stock : 0;
          const newStock = oldStock - deductQty;
          const productName = productData.name || 'Producto Desconocido';

          transaction.update(productRef, { stock: newStock });

          batchLogs.push({
            productId: pid,
            productName: productName,
            changeAmount: -deductQty,
            previousStock: oldStock,
            newStock: newStock,
            adjustedBy: adminName,
            timestamp: serverTimestamp(),
            reason: `Venta Pedido #${order.id.substring(0, 6).toUpperCase()}`
          });
        }

        transaction.update(orderRef, {
          status: 'confirmado',
          acceptedBy: adminName,
          processedAt: serverTimestamp()
        });

        order._pendingLogs = batchLogs;
      });

      if (order._pendingLogs) {
        for (const logItem of order._pendingLogs) {
          await addDoc(collection(db, 'inventory_logs'), logItem);
        }
        delete order._pendingLogs;
      }

      setSuccessMsg(`¡Pedido #${order.id.substring(0, 6).toUpperCase()} confirmado y stock descontado con éxito!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al procesar el pedido.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setActionLoading(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!orderId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(orderId);

    try {
      const orderRef = doc(db, 'orders', orderId);
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';

      await updateDoc(orderRef, {
        status: 'cancelado',
        acceptedBy: adminName,
        cancelledAt: serverTimestamp()
      });

      setSuccessMsg(`Pedido #${orderId.substring(0, 6).toUpperCase()} cancelado con éxito.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al cancelar la orden.");
    } finally {
      setActionLoading(null);
    }
  };

  const deliverOrder = async (orderId) => {
    if (!orderId) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(orderId);

    try {
      const orderRef = doc(db, 'orders', orderId);
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';

      await updateDoc(orderRef, {
        status: 'entregado',
        acceptedBy: adminName,
        deliveredAt: serverTimestamp()
      });

      setSuccessMsg(`Pedido #${orderId.substring(0, 6).toUpperCase()} marcado como entregado con éxito.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al marcar como entregado.");
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================================
  // ⚙️ OPERACIONES CRUD: CATEGORÍAS
  // ========================================================
  const openCreateCategory = () => {
    setErrorMsg(null);
    setCategoryForm({ id: '', name: '', imageUrl: '' });
    setShowCategoryModal(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const { id, name, imageUrl } = categoryForm;
    if (!name.trim() || !imageUrl.trim()) {
      setErrorMsg("Nombre e Imagen son campos obligatorios.");
      return;
    }

    const docId = id.trim() 
      ? id.trim().toLowerCase().replace(/\s+/g, '-')
      : name.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      await setDoc(doc(db, 'categories', docId), {
        name: name.trim(),
        imageUrl: imageUrl.trim()
      });
      setSuccessMsg(`Categoría "${name}" guardada con éxito.`);
      setShowCategoryModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al guardar la categoría.");
    }
  };

  const deleteCategory = async (catId, catName) => {
    if (!window.confirm(`¿Estás seguro de eliminar físicamente la categoría "${catName}"?\n(Esta acción no se puede deshacer y desvinculará los productos asociados)`)) return;

    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, 'categories', catId));
      setSuccessMsg(`Categoría "${catName}" eliminada permanentemente.`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al eliminar la categoría.");
    }
  };

  // ========================================================
  // ⚙️ OPERACIONES CRUD: PRODUCTOS
  // ========================================================
  const openCreateProduct = () => {
    setErrorMsg(null);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      userDiscount: '0',
      stock: '',
      imageUrl: '',
      categoryId: categories?.[0]?.id || '',
      isFeatured: false,
      isAvailable: true
    });
    setShowProductModal(true);
  };

  const openEditProduct = (prod) => {
    if (!prod) return;
    setErrorMsg(null);
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price.toString(),
      userDiscount: prod.userDiscount.toString(),
      stock: prod.stock.toString(),
      imageUrl: prod.imageUrl,
      categoryId: prod.categoryId,
      isFeatured: prod.isFeatured,
      isAvailable: prod.isAvailable
    });
    setShowProductModal(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const { name, description, price, userDiscount, stock, imageUrl, categoryId, isFeatured, isAvailable } = productForm;
    
    if (!name.trim() || !price.toString().trim() || !stock.toString().trim() || !imageUrl.trim() || !categoryId) {
      setErrorMsg("Nombre, Precio, Stock, Imagen y Categoría son requeridos.");
      return;
    }

    const priceVal = parseFloat(price);
    const discountVal = parseFloat(userDiscount || 0);
    const stockVal = parseInt(stock);

    if (isNaN(priceVal) || priceVal < 0 || isNaN(discountVal) || discountVal < 0 || isNaN(stockVal) || stockVal < 0) {
      setErrorMsg("Asegúrate de ingresar valores numéricos válidos y no negativos en Precio, Descuento y Stock.");
      return;
    }

    const productPayload = {
      name: name.trim(),
      description: description.trim(),
      price: priceVal,
      userDiscount: discountVal,
      stock: stockVal,
      imageUrl: imageUrl.trim(),
      categoryId: categoryId,
      isFeatured: !!isFeatured,
      isAvailable: !!isAvailable && stockVal > 0
    };

    try {
      if (editingProduct) {
        const oldStock = editingProduct.stock;
        if (oldStock !== stockVal) {
          const change = stockVal - oldStock;
          const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
          await addDoc(collection(db, 'inventory_logs'), {
            productId: editingProduct.id,
            productName: name.trim(),
            changeAmount: change,
            previousStock: oldStock,
            newStock: stockVal,
            adjustedBy: adminName,
            timestamp: serverTimestamp(),
            reason: `Ajuste manual del Administrador`
          });
        }

        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        setSuccessMsg(`Producto "${name}" modificado con éxito.`);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productPayload);
        const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
        
        await addDoc(collection(db, 'inventory_logs'), {
          productId: docRef.id,
          productName: name.trim(),
          changeAmount: stockVal,
          previousStock: 0,
          newStock: stockVal,
          adjustedBy: adminName,
          timestamp: serverTimestamp(),
          reason: `Creación del Producto`
        });

        setSuccessMsg(`Producto "${name}" creado exitosamente.`);
      }
      setShowProductModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al guardar el producto.");
    }
  };

  const deleteProduct = async (prodId, prodName) => {
    if (!window.confirm(`¿Estás 100% seguro de borrar físicamente el producto "${prodName}"?\n(Esta acción eliminará el stock y podría alterar combos configurados)`)) return;

    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, 'products', prodId));
      setSuccessMsg(`Producto "${prodName}" eliminado permanentemente.`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al borrar el producto.");
    }
  };

  // ========================================================
  // ⚙️ OPERACIONES CRUD: COMBOS
  // ========================================================
  const openCreateCombo = () => {
    setErrorMsg(null);
    setEditingCombo(null);
    setComboForm({
      name: '',
      description: '',
      specialPrice: '',
      imageUrl: '',
      isAvailable: true,
      productIds: []
    });
    setShowComboModal(true);
  };

  const openEditCombo = (combo) => {
    if (!combo) return;
    setErrorMsg(null);
    setEditingCombo(combo);
    setComboForm({
      name: combo.name,
      description: combo.description,
      specialPrice: combo.specialPrice.toString(),
      imageUrl: combo.imageUrl,
      isAvailable: combo.isAvailable,
      productIds: combo.productIds || []
    });
    setShowComboModal(true);
  };

  const saveCombo = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const { name, description, specialPrice, imageUrl, isAvailable, productIds } = comboForm;

    if (!name.trim() || !specialPrice.toString().trim() || !imageUrl.trim()) {
      setErrorMsg("Nombre, Precio Especial e Imagen son requeridos.");
      return;
    }

    if (productIds.length === 0) {
      setErrorMsg("Debes agregar al menos 1 producto constituyente al combo promocional.");
      return;
    }

    const priceVal = parseFloat(specialPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMsg("Precio especial inválido.");
      return;
    }

    const comboPayload = {
      name: name.trim(),
      description: description.trim(),
      specialPrice: priceVal,
      imageUrl: imageUrl.trim(),
      isAvailable: !!isAvailable,
      productIds: productIds
    };

    try {
      if (editingCombo) {
        await updateDoc(doc(db, 'combos', editingCombo.id), comboPayload);
        setSuccessMsg(`Combo "${name}" actualizado con éxito.`);
      } else {
        await addDoc(collection(db, 'combos'), comboPayload);
        setSuccessMsg(`Combo "${name}" creado con éxito.`);
      }
      setShowComboModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al guardar el combo.");
    }
  };

  const deleteCombo = async (comboId, comboName) => {
    if (!window.confirm(`¿Seguro de borrar permanentemente el combo "${comboName}"?`)) return;

    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, 'combos', comboId));
      setSuccessMsg(`Combo "${comboName}" eliminado.`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al borrar el combo.");
    }
  };

  const addProductIdToCombo = (pid) => {
    if (!pid) return;
    setComboForm(prev => ({
      ...prev,
      productIds: [...prev.productIds, pid]
    }));
  };

  const removeProductIdFromCombo = (pid) => {
    if (!pid) return;
    setComboForm(prev => {
      const idx = prev.productIds.indexOf(pid);
      if (idx === -1) return prev;
      
      const newProductIds = [...prev.productIds];
      newProductIds.splice(idx, 1);
      return {
        ...prev,
        productIds: newProductIds
      };
    });
  };

  const getComboMaquetadoInfo = () => {
    let originalTotal = 0;
    comboForm.productIds.forEach((pid) => {
      const p = products.find(prod => prod?.id === pid);
      if (p) {
        const discountedPrice = p.price * (1 - p.userDiscount / 100);
        originalTotal += discountedPrice;
      }
    });

    const specPrice = parseFloat(comboForm.specialPrice) || 0;
    const saving = originalTotal > specPrice ? originalTotal - specPrice : 0;
    const savingPct = originalTotal > 0 ? (saving / originalTotal) * 100 : 0;

    return {
      originalTotal,
      saving,
      savingPct
    };
  };

  // ========================================================
  // ⚙️ OPERACIONES CRUD: BANNERS DE CAMPAÑA
  // ========================================================
  const openCreateBanner = () => {
    setErrorMsg(null);
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      linkText: 'Ver Más',
      linkUrl: '/products'
    });
    setShowBannerModal(true);
  };

  const openEditBanner = (ban) => {
    if (!ban) return;
    setErrorMsg(null);
    setEditingBanner(ban);
    setBannerForm({
      title: ban.title,
      subtitle: ban.subtitle,
      description: ban.description,
      imageUrl: ban.imageUrl,
      linkText: ban.linkText,
      linkUrl: ban.linkUrl
    });
    setShowBannerModal(true);
  };

  const saveBanner = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const { title, subtitle, description, imageUrl, linkText, linkUrl } = bannerForm;
    if (!title.trim() || !imageUrl.trim()) {
      setErrorMsg("Título e Imagen de fondo son requeridos.");
      return;
    }

    const bannerPayload = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      linkText: linkText.trim(),
      linkUrl: linkUrl.trim()
    };

    try {
      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerPayload);
        setSuccessMsg("Banner de campaña actualizado.");
      } else {
        await addDoc(collection(db, 'banners'), bannerPayload);
        setSuccessMsg("Banner de campaña creado.");
      }
      setShowBannerModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al guardar el banner.");
    }
  };

  const deleteBanner = async (bannerId, bannerTitle) => {
    if (!window.confirm(`¿Seguro de quitar la campaña publicitaria "${bannerTitle}"?`)) return;

    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      setSuccessMsg(`Campaña "${bannerTitle}" eliminada.`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al eliminar the banner.");
    }
  };

  // Lógica de filtrado de pedidos en tiempo real con buscador e historial
  const activeOrders = (orders || []).filter(o => o && (o.status === 'pendiente' || o.status === 'confirmado'));
  const historyOrders = (orders || []).filter(o => o && (o.status === 'completado' || o.status === 'entregado' || o.status === 'cancelado'));
  
  const displayOrders = ordersSubTab === 'active' ? activeOrders : historyOrders;
  
  const filteredOrders = displayOrders.filter((o) => {
    if (!o) return false;
    const queryStr = orderSearchQuery.toLowerCase().trim();
    if (!queryStr) return true;
    
    const idMatch = o.id && o.id.toLowerCase().includes(queryStr);
    const shortIdMatch = o.id && o.id.substring(0, 6).toLowerCase().includes(queryStr);
    const nameMatch = o.customerName && o.customerName.toLowerCase().includes(queryStr);
    const phoneMatch = o.customerPhone && o.customerPhone.toLowerCase().includes(queryStr);
    const addressMatch = o.customerAddress && o.customerAddress.toLowerCase().includes(queryStr);
    const vendorMatch = o.acceptedBy && o.acceptedBy.toLowerCase().includes(queryStr);
    const statusMatch = o.status && o.status.toLowerCase().includes(queryStr);
    
    return idMatch || shortIdMatch || nameMatch || phoneMatch || addressMatch || vendorMatch || statusMatch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 text-left text-slate-100 relative min-h-[75vh]">
      
      {/* 🔮 LUCES DECORATIVAS */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none z-0 print:hidden" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0 print:hidden" />

      {/* ========================================================
          🔮 MENÚ LATERAL ERP COMPACTO (RESPONSIVO)
          ======================================================== */}
      <aside className="w-full lg:w-64 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between space-y-8 z-10 flex-shrink-0 print:hidden">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-850">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <ShieldAlert className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold tracking-widest text-xs uppercase text-slate-200">ETHEREAL ERP</span>
          </div>

          <nav className="flex flex-col space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, count: 0, activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { id: 'orders', name: 'Pedidos', icon: ShoppingBag, count: orders?.filter(o => o?.status === 'pendiente' || o?.status === 'confirmado')?.length || 0, activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { id: 'inventory', name: 'Inventario', icon: Database, count: products.filter(p => (p.stock || 0) < 5).length, activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { id: 'products', name: 'Productos', icon: Package, count: 0, activeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { id: 'combos', name: 'Combos Promos', icon: Layers, count: combos.filter(c => getComboAvailabilityStatus(c).isOutOfStock).length, activeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
              { id: 'banners', name: 'Campañas Hero', icon: Image, count: 0, activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { id: 'categories', name: 'Categorías', icon: Tag, count: 0, activeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActiveSection(sec.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeSection === sec.id ? `${sec.activeColor} border` : 'border-transparent text-slate-450 hover:text-slate-200 hover:bg-slate-950/30'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <sec.icon className="h-4.5 w-4.5" />
                  <span>{sec.name}</span>
                </div>
                {sec.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${activeSection === sec.id ? 'bg-slate-950 text-current' : 'bg-slate-950 text-slate-500'}`}>
                    {sec.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-850">
          <Button 
            variant="danger" 
            size="sm"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 cursor-pointer text-white shadow-lg border border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar ERP</span>
          </Button>
        </div>
      </aside>

      {/* ========================================================
          🔮 SECCIÓN CONTENIDO PRINCIPAL DINÁMICO
          ======================================================== */}
      <main className="flex-grow space-y-6 z-10">
        
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3 shadow-lg animate-fadeIn text-left">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
            <div className="flex-grow space-y-1">
              <h5 className="font-bold text-red-300">Acción Revertida</h5>
              <p className="leading-relaxed font-normal whitespace-pre-line">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-500 hover:text-white font-bold px-1.5 cursor-pointer">×</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start space-x-3 shadow-lg animate-fadeIn text-left">
            <Check className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-400" />
            <div className="flex-grow space-y-1">
              <h5 className="font-bold text-emerald-300">Éxito</h5>
              <p className="leading-relaxed font-normal">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-slate-500 hover:text-white font-bold px-1.5 cursor-pointer">×</button>
          </div>
        )}

        {/* ==============================================================================================================
            0. SECCIÓN: RESUMEN / DASHBOARD GENERAL (INICIO)
            ============================================================================================================== */}
        {/* ==============================================================================================================
            0. SECCIÓN: RESUMEN / DASHBOARD GENERAL (INICIO)
            ============================================================================================================== */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 📄 ESTILOS DE IMPRESIÓN PDF DINÁMICOS */}
            <style>{`
              @media print {
                body, html, #root {
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                aside, nav, button, header, .print\\:hidden {
                  display: none !important;
                }
                main {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                div[class*="bg-"] {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #cbd5e1 !important;
                  box-shadow: none !important;
                  color: #0f172a !important;
                }
                span, p, h1, h2, h3, h4, h5, td, th {
                  color: #0f172a !important;
                }
                .text-emerald-400 { color: #047857 !important; }
                .text-purple-400 { color: #6d28d9 !important; }
                .text-indigo-400 { color: #4338ca !important; }
                .text-pink-400 { color: #be185d !important; }
                .text-amber-400 { color: #b45309 !important; }
                .text-red-400 { color: #b91c1c !important; }
                
                svg line {
                  stroke: #cbd5e1 !important;
                }
                svg text {
                  fill: #475569 !important;
                }
                circle {
                  fill: #ffffff !important;
                  stroke: #6d28d9 !important;
                }
                path.stroke-purple-500 {
                  stroke: #6d28d9 !important;
                  stroke-width: 3px !important;
                }
                path[fill="url(#chartGradient)"] {
                  fill: rgba(109, 40, 217, 0.05) !important;
                }
                
                .grid {
                  display: grid !important;
                  gap: 1.5rem !important;
                }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                .xl\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
              }
            `}</style>

            {/* 👑 BIENVENIDA Y RESUMEN GENERAL */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
              <div className="text-left">
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400 animate-pulse print:hidden" />
                  Panel de Control General
                </h2>
                <p className="text-xs text-slate-400 mt-1">Monitoreo en tiempo real de ventas, inventario y usuarios.</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Botón de Impresión PDF */}
                <button
                  type="button"
                  onClick={handlePrintPdfFromXml}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg border border-purple-500/20 cursor-pointer select-none print:hidden focus:outline-none"
                >
                  <FileText className="h-4 w-4" />
                  <span>Reporte PDF</span>
                </button>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase tracking-widest font-extrabold bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850 print:hidden">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Conexión Activa ERP</span>
                </div>
              </div>
            </div>

            {/* 📊 KPI CARDS GRID (FINANZAS TEMPORALES Y TOTALES) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Earnings Today Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-purple-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-purple-400">Ganancias de Hoy</span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">
                  ${dailyEarnings.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-550 block mt-1">Cierre de caja diario</span>
              </div>

              {/* Earnings Weekly Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-indigo-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-indigo-400">Últimos 7 Días</span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">
                  ${weeklyEarnings.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-550 block mt-1">Facturación semanal</span>
              </div>

              {/* Earnings Monthly Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-pink-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-pink-400">Último Mes</span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">
                  ${monthlyEarnings.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-550 block mt-1">Facturación últimos 30 días</span>
              </div>

              {/* Total Earnings Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 text-left relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-emerald-400">Total Histórico</span>
                <span className="text-2xl font-black text-emerald-400 mt-1.5 block font-mono">
                  ${metrics.totalEarnings.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-550 block mt-1">Acumulado completo</span>
              </div>
            </div>

            {/* 👑 PANEL DE EVOLUCIÓN FINANCIERA (GRÁFICO) & TOP PRODUCTOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* GRÁFICO DE FACTURACIÓN (TOMA 2/3 DE ANCHO EN lg) */}
              <div className="lg:col-span-2 bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
                  <div className="text-left">
                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                      <TrendingUp className="h-4.5 w-4.5 text-purple-400" />
                      Evolución de Facturación
                    </h3>
                    <p className="text-[10px] text-slate-450">Ventas diarias netas acumuladas de órdenes completadas.</p>
                  </div>
                  
                  {/* Selector de Rango */}
                  <div className="flex bg-slate-950/60 p-0.5 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => {
                        setChartRange('7days');
                        setActivePointIndex(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        chartRange === '7days' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'text-slate-500 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      7 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChartRange('30days');
                        setActivePointIndex(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        chartRange === '30days' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'text-slate-500 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      30 Días
                    </button>
                  </div>
                </div>

                {/* DIBUJO DEL GRÁFICO SVG */}
                {(() => {
                  const chartData = getDailyEarningsRange(chartRange);
                  const chartWidth = 500;
                  const chartHeight = 220;
                  const paddingLeft = 45;
                  const paddingRight = 15;
                  const paddingTop = 25;
                  const paddingBottom = 30;

                  const plotWidth = chartWidth - paddingLeft - paddingRight;
                  const plotHeight = chartHeight - paddingTop - paddingBottom;

                  const maxVal = Math.max(...chartData.map(d => d.earnings), 50);
                  const roundedMaxVal = Math.ceil(maxVal / 10) * 10;

                  const points = chartData.map((d, i) => {
                    const x = paddingLeft + (i * (plotWidth / (chartData.length - 1 || 1)));
                    const y = chartHeight - paddingBottom - ((d.earnings / roundedMaxVal) * plotHeight);
                    return { x, y, ...d };
                  });

                  // Line path definition
                  let linePath = "";
                  let areaPath = "";
                  if (points.length > 0) {
                    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
                    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
                  }

                  // 4 ticks for gridlines
                  const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
                    const val = ratio * roundedMaxVal;
                    const y = chartHeight - paddingBottom - (ratio * plotHeight);
                    return { val, y };
                  });

                  const isAllZero = chartData.every(d => d.earnings === 0);

                  return (
                    <div className="relative pt-2">
                      {isAllZero ? (
                        <div className="h-[220px] flex flex-col items-center justify-center text-slate-550 space-y-1.5 border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
                          <TrendingUp className="h-7 w-7 text-slate-700 animate-pulse" />
                          <span className="text-[10px] uppercase tracking-wider font-bold">Sin datos de ventas en este período</span>
                        </div>
                      ) : (
                        <div className="relative w-full overflow-hidden">
                          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                            <defs>
                              {/* Purple neon gradient */}
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.25)" />
                                <stop offset="100%" stopColor="rgba(147, 51, 234, 0.0)" />
                              </linearGradient>
                            </defs>

                            {/* Horizontal Gridlines */}
                            {gridLines.map((line, idx) => (
                              <g key={idx}>
                                <line 
                                  x1={paddingLeft} 
                                  y1={line.y} 
                                  x2={chartWidth - paddingRight} 
                                  y2={line.y} 
                                  className="stroke-slate-850/80" 
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                />
                                <text 
                                  x={paddingLeft - 8} 
                                  y={line.y + 3} 
                                  textAnchor="end" 
                                  className="fill-slate-500 font-mono text-[9px] font-bold"
                                >
                                  ${line.val.toFixed(0)}
                                </text>
                              </g>
                            ))}

                            {/* Fill Area */}
                            <path d={areaPath} fill="url(#chartGradient)" />

                            {/* Main Stroke Line */}
                            <path 
                              d={linePath} 
                              fill="none" 
                              className="stroke-purple-500" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                            />

                            {/* Guideline (on hover) */}
                            {activePointIndex !== null && points[activePointIndex] && (
                              <line 
                                x1={points[activePointIndex].x} 
                                y1={paddingTop} 
                                x2={points[activePointIndex].x} 
                                y2={chartHeight - paddingBottom} 
                                className="stroke-purple-500/40" 
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                            )}

                            {/* Ticks on X Axis */}
                            {points.map((p, i) => {
                              const showLabel = chartRange === '7days' ? true : (i % 5 === 0 || i === points.length - 1);
                              return (
                                <g key={i}>
                                  {showLabel && (
                                    <text 
                                      x={p.x} 
                                      y={chartHeight - 12} 
                                      textAnchor="middle" 
                                      className="fill-slate-500 font-mono text-[8px] font-extrabold uppercase"
                                    >
                                      {p.dateLabel}
                                    </text>
                                  )}

                                  {/* Point Circle */}
                                  <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={activePointIndex === i ? 5.5 : 2.5} 
                                    className={`transition-all duration-75 ${
                                      activePointIndex === i 
                                        ? 'fill-purple-400 stroke-purple-600 stroke-[2]' 
                                        : 'fill-slate-900 stroke-purple-500/70 stroke-[1.5]'
                                    }`}
                                  />
                                </g>
                              );
                            })}

                            {/* Interactive Columns overlay to handle hover */}
                            {points.map((p, i) => {
                              const colWidth = plotWidth / (chartData.length - 1 || 1);
                              const xStart = p.x - (colWidth / 2);
                              return (
                                <rect
                                  key={i}
                                  x={xStart}
                                  y={paddingTop}
                                  width={colWidth}
                                  height={plotHeight}
                                  fill="transparent"
                                  className="cursor-crosshair"
                                  onMouseEnter={() => setActivePointIndex(i)}
                                  onMouseLeave={() => setActivePointIndex(null)}
                                />
                              );
                            })}
                          </svg>

                          {/* Float Absolute Tooltip */}
                          {activePointIndex !== null && points[activePointIndex] && (
                            <div 
                              className="absolute bg-slate-950/95 border border-purple-500/30 rounded-xl p-2.5 shadow-xl text-left pointer-events-none z-20 backdrop-blur-md transition-all duration-75 text-[10px] space-y-0.5"
                              style={{ 
                                left: `${(points[activePointIndex].x / chartWidth) * 100}%`, 
                                top: `${(points[activePointIndex].y / chartHeight) * 100 - 15}%`,
                                transform: 'translate(-50%, -100%)' 
                              }}
                            >
                              <span className="text-slate-550 font-extrabold block uppercase tracking-wider text-[8px]">{points[activePointIndex].dateStr}</span>
                              <span className="font-mono font-bold text-white text-xs block">Facturado: <span className="text-emerald-400">${points[activePointIndex].earnings.toFixed(2)}</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* PRODUCTOS MÁS RENTABLES (TOP 5 INGRESOS) */}
              <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2 font-sans">
                    <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                    Top 5 Más Rentables
                  </h3>
                  <span className="text-[9px] uppercase text-slate-550 tracking-wider">Por ingresos generados</span>
                </div>

                {getTopRevenueProducts().length === 0 ? (
                  <div className="py-12 text-center text-slate-550 text-xs">
                    No se registran ventas en órdenes completadas todavía.
                  </div>
                ) : (
                  <div className="space-y-3 font-sans">
                    {getTopRevenueProducts().map((item, index) => (
                      <div key={item.id || index} className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-between gap-4 font-sans">
                        <div className="flex items-center space-x-3 text-left">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white block text-xs">{item.name}</span>
                            <span className="text-[9px] font-extrabold uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10 mt-1 inline-block">
                              {item.isCombo ? 'Combo' : 'Producto'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-mono">{item.quantity} un.</span>
                          <span className="font-black text-emerald-400 font-mono block text-xs">${item.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 👑 BOTTOM GRID (Low Stock & Users) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* PRODUCTOS POR AGOTARSE */}
              <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 font-sans">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                    Productos por Agotarse (Stock Crítico)
                  </h3>
                  <span className="text-[9px] uppercase text-slate-550 tracking-wider">Menos de 5 unidades</span>
                </div>

                {products.filter(p => (p.stock || 0) <= 5).length === 0 ? (
                  <div className="py-6 text-center text-slate-550 text-xs">
                    No hay productos con stock crítico. ¡Todo surtido!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {products
                      .filter(p => (p.stock || 0) <= 5)
                      .map((prod, idx) => (
                        <div key={prod.id || idx} className="bg-slate-950/20 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2.5 text-left">
                            <img src={prod.imageUrl} alt={prod.name} className="w-7 h-7 rounded-md object-cover bg-slate-950" />
                            <span className="font-bold text-white text-xs block truncate max-w-[180px]">{prod.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            {prod.stock <= 0 ? (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                                Agotado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                                Quedan {prod.stock} un.
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection('inventory');
                                setTimeout(() => {
                                  openStockAdjustment(prod);
                                }, 100);
                              }}
                              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white hover:bg-emerald-600 cursor-pointer transition-colors"
                              title="Abastecer Stock"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ÚLTIMOS USUARIOS REGISTRADOS */}
              <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 font-sans">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-indigo-400" />
                    Últimos Usuarios Registrados
                  </h3>
                  <span className="text-[9px] uppercase text-slate-550 tracking-wider">Base de clientes</span>
                </div>

                {users.length === 0 ? (
                  <div className="py-6 text-center text-slate-550 text-xs">
                    No hay usuarios registrados aún.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {users.slice(0, 5).map((u, idx) => (
                      <div key={u.id || idx} className="bg-slate-950/20 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between gap-3 text-left">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xs block">{u.displayName}</span>
                          <span className="text-[10px] text-slate-455 block truncate max-w-[200px]">{u.email}</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : u.role === 'premium'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-450'
                          }`}>
                            {u.role}
                          </span>
                          <span className="text-[8px] text-slate-550 block mt-0.5">{u.createdAtFormatted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==============================================================================================================
            A. SECCIÓN: PEDIDOS E INVENTARIO
            ============================================================================================================== */}
        {activeSection === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Total Órdenes</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalOrders}</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-amber-400">Pendientes</span>
                <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{metrics.pendingOrders}</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-emerald-400">Completadas</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics.completedOrders}</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-red-500">Canceladas</span>
                <span className="text-2xl font-extrabold text-red-500 mt-1 block">{orders?.filter(o => o?.status === 'cancelado')?.length || 0}</span>
              </div>
            </div>

            {/* ℹ️ NOTA EXPLICATIVA DE NOTIFICACIONES */}
            <div className="p-4.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-slate-300 text-xs flex items-start space-x-3 shadow-lg">
              <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Indicador de Notificación (Menú Izquierdo)</span>
                <p className="leading-relaxed text-slate-400 font-normal">
                  El número de notificación al lado de <strong>"Pedidos"</strong> en la barra de navegación izquierda representa la suma de pedidos en estado <strong className="text-amber-400">🟡 Pendiente</strong> y <strong className="text-blue-400">🔵 Confirmado</strong>.
                </p>
              </div>
            </div>

            {/* Sub-pestañas de Pedidos */}
            <div className="flex border-b border-slate-800/80 mb-2">
              <button
                type="button"
                onClick={() => {
                  setOrdersSubTab('active');
                  setOrderSearchQuery('');
                }}
                className={`py-3 px-6 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer select-none ${
                  ordersSubTab === 'active'
                    ? 'border-[#ff0055] text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Pedidos Activos ({activeOrders.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrdersSubTab('history');
                  setOrderSearchQuery('');
                }}
                className={`py-3 px-6 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer select-none ${
                  ordersSubTab === 'history'
                    ? 'border-[#ff0055] text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Historial de Ventas ({historyOrders.length})
              </button>
            </div>

            {/* Listado de Órdenes */}
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-3 gap-3">
                <div className="flex items-center space-x-3">
                  <h3 className="font-extrabold text-white text-base">
                    {ordersSubTab === 'active' ? 'Monitor de Pedidos Recibidos' : 'Historial de Auditoría de Ventas'}
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-purple-400" />
                    En Tiempo Real
                  </span>
                </div>

                {/* Buscador Integrado */}
                <div className="w-full md:w-80 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-550" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por ID, cliente, celular, vendedor..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-550 focus:outline-none focus:border-[#ff0055]/50 transition-all font-sans"
                  />
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-550 hover:text-white cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {loadingOrders ? (
                <div className="py-10 text-center text-slate-400 text-xs">Cargando órdenes...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-10 text-center text-slate-550 text-xs">No hay pedidos registrados con esta pestaña.</div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order, idx) => {
                    if (!order) return null;
                    const shortId = order?.id ? order.id.substring(0, 6).toUpperCase() : `MOCK-${idx}`;
                    const isExpanded = expandedOrders[order?.id || shortId];
                    const statusBadges = {
                      pendiente: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                      confirmado: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                      completado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                      entregado: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                      cancelado: 'bg-red-500/10 border-red-500/20 text-red-400',
                    };

                    const statusLabels = {
                      pendiente: '🟡 Pendiente',
                      confirmado: '🔵 Confirmado',
                      completado: '🟢 Entregado',
                      entregado: '🟢 Entregado',
                      cancelado: '🔴 Pedido Cancelado'
                    };

                    return (
                      <div key={order?.id || `ord-${idx}`} className="border border-slate-850 bg-slate-950/20 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold text-purple-400">PEDIDO #{shortId}</span>
                            <h4 className="text-sm font-bold text-white leading-none">{order?.customerName || 'Invitado'}</h4>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${statusBadges[order?.status] || 'bg-slate-800 text-slate-400'}`}>
                              {statusLabels[order?.status] || order?.status || '🟡 Pendiente'}
                            </span>
                            <span className="font-mono text-sm font-extrabold text-purple-400">${order?.totalAmount?.toFixed(2) || '0.00'}</span>
                            <button 
                              onClick={() => toggleExpand(order?.id || shortId)}
                              className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
                            >
                              {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-850 space-y-4 animate-fadeIn text-xs leading-normal">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl text-slate-400 border border-slate-900/60">
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Datos del Comprador (Cliente)</span>
                                <p>👤 Nombre: <strong className="text-white">{order?.customerName || 'Invitado'}</strong></p>
                                <p>📞 Celular: <strong className="text-white">{order?.customerPhone || 'N/A'}</strong></p>
                                <p>📍 Dirección: <strong className="text-white">{order?.customerAddress || 'N/A'}</strong></p>
                              </div>
                              <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-850 pt-2.5 md:pt-0 md:pl-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Auditoría de Venta</span>
                                <p>💳 Método de Pago: <strong className="text-white uppercase">{(order?.paymentMethod === 'transferencia' || order?.paymentMethod === 'whatsapp') ? 'Transferencia' : 'Efectivo'}</strong></p>
                                <p>📅 Fecha de Pedido: <strong className="text-white">{order?.createdAtFormatted || 'N/A'}</strong></p>
                                {order?.acceptedBy ? (
                                  <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                                    <p className="font-semibold text-[10px]">🛡️ Vendedor/Procesador:</p>
                                    <p className="text-white font-extrabold">{order.acceptedBy}</p>
                                    {order.processedAt && (
                                      <p className="text-[10px] text-slate-500">
                                        Aprobado: {order.processedAt.toDate ? order.processedAt.toDate().toLocaleString('es-CO') : new Date(order.processedAt.seconds * 1000).toLocaleString('es-CO')}
                                      </p>
                                    )}
                                    {order.deliveredAt && (
                                      <p className="text-[10px] text-slate-500">
                                        Entregado: {order.deliveredAt.toDate ? order.deliveredAt.toDate().toLocaleString('es-CO') : new Date(order.deliveredAt.seconds * 1000).toLocaleString('es-CO')}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-400">
                                    <p className="font-semibold text-[10px]">⏳ Estado Administrativo:</p>
                                    <p className="text-white font-extrabold">Pendiente de Vendedor</p>
                                  </div>
                                )}
                                {order?.status === 'cancelado' && order?.cancelledAt && (
                                  <div className="space-y-0.5 mt-2 p-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400">
                                    <p className="font-semibold text-[10px]">🔴 Cancelado el:</p>
                                    <p className="text-white text-[10px]">
                                      {order.cancelledAt.toDate ? order.cancelledAt.toDate().toLocaleString('es-CO') : new Date(order.cancelledAt.seconds * 1000).toLocaleString('es-CO')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Artículos en pedido:</span>
                              <div className="space-y-2">
                                {(order?.items || []).map((item, itemIdx) => {
                                  if (!item) return null;
                                  return (
                                    <div key={itemIdx} className="bg-slate-950/30 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between">
                                      <div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{item?.isCombo ? 'Combo' : 'Producto'}</span>
                                        <h5 className="font-bold text-white text-[12px]">{item?.name || 'Artículo'}</h5>
                                      </div>
                                      <div className="text-right font-mono text-[11px]">
                                        <span className="text-slate-400 block">{item?.quantity || 1} x ${item?.price?.toFixed(2) || '0.00'}</span>
                                        <span className="font-bold text-purple-300">${((item?.quantity || 1) * (item?.price || 0))?.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {order?.status === 'pendiente' && (
                              <div className="flex items-center justify-end space-x-3 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === (order?.id || shortId)}
                                  onClick={() => cancelOrder(order?.id || shortId)}
                                  className="text-red-400 hover:text-white border-red-500/20 hover:bg-red-600 font-bold"
                                >
                                  Cancelar Pedido
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={actionLoading === (order?.id || shortId)}
                                  onClick={() => confirmOrder(order)}
                                  className="bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-slate-955 shadow-md font-bold flex items-center space-x-1.5 border-none"
                                >
                                  {actionLoading === (order?.id || shortId) ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      <span>Aprobar y Descontar Stock</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {order?.status === 'confirmado' && (
                              <div className="flex items-center justify-end space-x-3 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === (order?.id || shortId)}
                                  onClick={() => cancelOrder(order?.id || shortId)}
                                  className="text-red-400 hover:text-white border-red-500/20 hover:bg-red-600 font-bold"
                                >
                                  Cancelar Pedido
                                </Button>
                                <Button
                                  type="button"
                                  disabled={actionLoading === (order?.id || shortId)}
                                  onClick={() => deliverOrder(order?.id || shortId)}
                                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all duration-300 border-none"
                                >
                                  {actionLoading === (order?.id || shortId) ? (
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      <span>Marcar como Entregado</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cierre de sección Pedidos */}
          </div>
        )}

        {/* ==============================================================================================================
            X. SECCIÓN: GESTIÓN DE INVENTARIO
            ============================================================================================================== */}
        {activeSection === 'inventory' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI STATS DE INVENTARIO */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Productos en Catálogo</span>
                <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalProducts}</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-emerald-400">Stock Disponible (Total)</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {products.reduce((acc, p) => acc + (p.stock || 0), 0)} un.
                </span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4.5 animate-fadeIn">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block text-red-400">Productos Agotados</span>
                <span className="text-2xl font-extrabold text-red-400 mt-1 block">
                  {products.filter(p => (p.stock || 0) === 0).length}
                </span>
              </div>
            </div>

            {/* ℹ️ NOTA EXPLICATIVA DE NOTIFICACIONES */}
            <div className="p-4.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-slate-300 text-xs flex items-start space-x-3 shadow-lg">
              <Info className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="font-bold text-slate-200">Indicador de Notificación (Menú Izquierdo)</span>
                <p className="leading-relaxed text-slate-400 font-normal">
                  El número de notificación al lado de <strong>"Inventario"</strong> en la barra de navegación izquierda representa la cantidad de productos con stock crítico (aquellos con existencias <strong className="text-orange-400">por debajo de 5 unidades</strong> o <strong className="text-red-400">sin stock / agotados</strong>).
                </p>
              </div>
            </div>

            {/* Tabla de existencias de inventario con buscador y botón de ajuste */}
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <h3 className="font-extrabold text-white text-base">Control de Stock y Existencias</h3>
                <span className="text-[10px] uppercase text-slate-500 tracking-wider">Ajuste rápido de inventario</span>
              </div>

              {loadingProducts ? (
                <div className="py-8 text-center text-slate-400 text-xs">Cargando inventario...</div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-slate-550 text-xs">No hay productos en inventario.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-850 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-450 uppercase text-[9px] font-extrabold bg-slate-950/30">
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-center">Nivel de Stock</th>
                        <th className="py-3 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40">
                      {products.map((prod, idx) => {
                        const cat = categories.find(c => c.id === prod.categoryId);
                        return (
                          <tr key={prod.id || idx} className="hover:bg-slate-950/20 transition-colors">
                            <td className="py-3 px-4 flex items-center space-x-3">
                              <img src={prod.imageUrl} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950" />
                              <span className="font-bold text-white">{prod.name}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-450">{cat?.name || prod.categoryId}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold">
                              {prod.stock > 10 ? (
                                <span className="text-emerald-400">{prod.stock} un.</span>
                              ) : prod.stock > 0 ? (
                                <span className="text-orange-400">{prod.stock} un. (Bajo)</span>
                              ) : (
                                <span className="text-red-500 uppercase text-[9px] bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 font-bold">Agotado</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => openStockAdjustment(prod)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Ajustar Stock</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bitácora de Auditoría del Inventario */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 text-xs font-mono space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <History className="h-4.5 w-4.5 text-purple-400" />
                  <span>Bitácora de Auditoría del Inventario</span>
                </div>
                <span className="text-[10px] uppercase text-slate-500 tracking-wider">Historial de variaciones</span>
              </div>

              {loadingLogs ? (
                <div className="py-6 text-center text-slate-550">Cargando bitácora...</div>
              ) : inventoryLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-550">Sin registros de auditoría aún.</div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {inventoryLogs.map((log, idx) => {
                    const isReduction = (log?.changeAmount || 0) < 0;
                    return (
                      <div key={log?.id || idx} className={`border rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left ${isReduction ? 'bg-red-500/[0.015] border-red-500/10' : 'bg-emerald-500/[0.015] border-emerald-500/10'}`}>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                          <span>{log?.timestampFormatted || 'Justo ahora'}</span>
                          <span className="text-slate-700">|</span>
                          <span className="font-bold text-slate-400 uppercase">{log?.adjustedBy || 'ERP'}</span>
                        </div>
                        <div className="flex-grow space-y-0.5">
                          <span className="text-slate-200 font-bold block">{log?.productName || 'Producto'}</span>
                          <span className="text-slate-550 text-[10px] block">{log?.reason || 'Ajuste manual'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] text-slate-500">
                            <span>Prev: {log?.previousStock || 0}u </span>
                            <span>| New: {log?.newStock || 0}u</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${isReduction ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            {isReduction ? '-' : '+'}{Math.abs(log?.changeAmount || 0)} un.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================================================================
            B. SECCIÓN: GESTIÓN DE PRODUCTOS
            ============================================================================================================== */}
        {activeSection === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Catálogo de Productos</h3>
                  <p className="text-xs text-slate-400 mt-1">Crea, edita y administra existencias del inventario individual.</p>
                </div>
                <Button 
                  onClick={openCreateProduct}
                  variant="primary" 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Producto</span>
                </Button>
              </div>

              {loadingProducts ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando productos del catálogo...</div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Package className="h-8 w-8 text-slate-650 mx-auto" />
                  <p>No hay productos en Firestore.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-850 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-450 uppercase text-[9px] font-extrabold bg-slate-950/30">
                        <th className="py-3 px-4">Producto</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-right">Precio Real</th>
                        <th className="py-3 px-4 text-center">Descuento</th>
                        <th className="py-3 px-4 text-center">Inventario</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40">
                      {products.map((prod, idx) => {
                        if (!prod) return null;
                        const hasDiscount = (prod?.userDiscount || 0) > 0;
                        const finalPrice = hasDiscount ? (prod?.price || 0) * (1 - (prod?.userDiscount || 0) / 100) : (prod?.price || 0);
                        const cat = categories.find(c => c?.id === prod?.categoryId);

                        return (
                          <tr key={prod?.id || `prod-${idx}`} className="hover:bg-slate-950/20 transition-colors">
                            <td className="py-3.5 px-4 flex items-center space-x-3">
                              <img src={prod?.imageUrl} alt={prod?.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950" />
                              <div>
                                <span className="font-bold text-white block">{prod?.name || 'Artículo'}</span>
                                {prod?.isFeatured && <span className="text-[9px] font-extrabold uppercase text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10">Destacado</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-350">{cat?.name || prod?.categoryId || 'N/A'}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                              ${finalPrice.toFixed(2)}
                              {hasDiscount && <span className="text-[9px] text-slate-500 line-through block font-normal">${(prod?.price || 0).toFixed(2)}</span>}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold">
                              {hasDiscount ? (
                                <span className="text-pink-400">-{prod?.userDiscount}% OFF</span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {(prod?.stock || 0) > 10 ? (
                                <span className="text-emerald-400 font-mono font-bold">{prod?.stock || 0} un.</span>
                              ) : (prod?.stock || 0) > 0 ? (
                                <span className="text-orange-400 font-mono font-bold">Bajo ({prod?.stock || 0} u.)</span>
                              ) : (
                                <span className="text-red-500 font-bold uppercase tracking-wider text-[9px] bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">Agotado</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button 
                                  onClick={() => openEditProduct(prod)}
                                  title="Editar especificaciones"
                                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => deleteProduct(prod?.id, prod?.name)}
                                  title="Eliminar del catálogo"
                                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:text-white hover:bg-red-650 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================================================================
            C. SECCIÓN: GESTIÓN DE COMBOS PROMOCIONALES
            ============================================================================================================== */}
        {activeSection === 'combos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Combos y Megapacks</h3>
                  <p className="text-xs text-slate-400 mt-1">Arma combos de descuento compuestos por múltiples productos individuales.</p>
                </div>
                <Button 
                  onClick={openCreateCombo}
                  variant="primary" 
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700 shadow-md font-bold flex items-center space-x-2 border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Combo</span>
                </Button>
              </div>

              {loadingCombos ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando combos...</div>
              ) : combos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Layers className="h-8 w-8 text-slate-650 mx-auto" />
                  <p>No hay combos configurados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {combos.map((combo, idx) => {
                    if (!combo) return null;
                    return (
                      <div key={combo?.id || `combo-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-pink-500/20 transition-all flex flex-col justify-between">
                        <div className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                            <ComboImageCollage 
                              productIds={combo?.productIds} 
                              products={products} 
                              defaultImageUrl={combo?.imageUrl}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="text-left space-y-1">
                            <span className="text-[10px] font-extrabold uppercase text-pink-400">Promoción Armada</span>
                            <h4 className="font-bold text-white text-sm leading-tight line-clamp-1">{combo?.name}</h4>
                            <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed">{combo?.description}</p>
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {combo?.productIds?.map((pid, pIdx) => {
                                if (!pid) return null;
                                const p = products.find(prod => prod?.id === pid);
                                return (
                                  <span key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-350 text-[9px] truncate max-w-[120px]" title={p?.name || 'Artículo'}>
                                    {p?.name || 'Artículo'}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Alertas de disponibilidad y stock de componentes */}
                            {(() => {
                              const status = getComboAvailabilityStatus(combo);
                              if (status.issues.length === 0) return null;
                              return (
                                <div className="mt-2 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg flex flex-col space-y-0.5">
                                  <span className="uppercase tracking-wider text-[8px] text-slate-450 block mb-0.5">⚠️ Alertas de Componentes:</span>
                                  {status.issues.map((issue, issueIdx) => {
                                    if (issue.type === 'no_encontrado') return <span key={issueIdx}>• {issue.name} (No encontrado)</span>;
                                    if (issue.type === 'no_disponible') return <span key={issueIdx}>• {issue.name} (Pausado)</span>;
                                    if (issue.type === 'sin_stock') return <span key={issueIdx}>• {issue.name} (Sin Stock / Agotado)</span>;
                                    if (issue.type === 'stock_bajo') return <span key={issueIdx} className="text-amber-400">• {issue.name} (Bajo: {issue.stock} un.)</span>;
                                    return null;
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="bg-slate-950/35 border-t border-slate-850 px-4 py-3 flex items-center justify-between gap-4">
                          <div className="text-left">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Precio del Pack</span>
                            <span className="font-mono text-base font-extrabold text-white">${combo?.specialPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider ${combo?.isAvailable ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                              {combo?.isAvailable ? 'Disponible' : 'Pausado'}
                            </span>
                            <button 
                              onClick={() => openEditCombo(combo)}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-indigo-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteCombo(combo?.id, combo?.name)}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-red-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================================================================
            D. SECCIÓN: GESTIÓN DE BANNERS DE CAMPAÑAS
            ============================================================================================================== */}
        {activeSection === 'banners' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Campañas Publicitarias (Hero Banners)</h3>
                  <p className="text-xs text-slate-400 mt-1">Administra los anuncios adaptativos rotatorios en la página de inicio del cliente.</p>
                </div>
                <Button 
                  onClick={openCreateBanner}
                  variant="primary" 
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold flex items-center space-x-2 border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Campaña</span>
                </Button>
              </div>

              {loadingBanners ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando banners publicitarios...</div>
              ) : banners.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Image className="h-8 w-8 text-slate-650 mx-auto" />
                  <p>No hay campañas publicitarias activas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {banners.map((ban, idx) => {
                    if (!ban) return null;
                    return (
                      <div key={ban?.id || `ban-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                        <div className="relative h-44 overflow-hidden bg-slate-950 flex items-center">
                          <img src={ban?.imageUrl} alt={ban?.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                          
                          <div className="relative z-10 p-6 space-y-2 max-w-lg text-left">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">{ban?.subtitle || 'CAMPAÑA WEB'}</span>
                            <h4 className="text-xl font-extrabold text-white uppercase">{ban?.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ban?.description}</p>
                          </div>
                        </div>

                        <div className="bg-slate-950/35 border-t border-slate-850 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                          <div className="flex flex-wrap gap-4 text-slate-450">
                            <span>🔗 Enlace: <strong className="text-slate-350">{ban?.linkUrl}</strong></span>
                            <span>🏷️ Botón: <strong className="text-slate-350">{ban?.linkText}</strong></span>
                          </div>

                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openEditBanner(ban)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-indigo-400 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 font-bold"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </button>
                            <button 
                              onClick={() => deleteBanner(ban?.id, ban?.title)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-red-500 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5 font-bold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================================================================
            E. SECCIÓN: GESTIÓN DE CATEGORÍAS
            ============================================================================================================== */}
        {activeSection === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Categorías del Catálogo</h3>
                  <p className="text-xs text-slate-400 mt-1">Administra los grupos taxonómicos en los que se dividen tus productos.</p>
                </div>
                <Button 
                  onClick={openCreateCategory}
                  variant="primary" 
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 shadow-md font-bold flex items-center space-x-2 border-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Categoría</span>
                </Button>
              </div>

              {loadingCategories ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando categorías...</div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Tag className="h-8 w-8 text-slate-650 mx-auto" />
                  <p>No hay categorías registradas en Firestore.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((cat, idx) => {
                    if (!cat) return null;
                    return (
                      <div key={cat?.id || `cat-${idx}`} className="bg-slate-950/20 border border-slate-850 rounded-2xl overflow-hidden hover:border-cyan-500/25 transition-all p-4 text-center space-y-3 flex flex-col justify-between items-center relative group">
                        
                        <button 
                          onClick={() => deleteCategory(cat?.id, cat?.name)}
                          title="Eliminar categoría"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
                          <img src={cat?.imageUrl} alt={cat?.name} className="w-full h-full object-cover opacity-80" />
                        </div>

                        <div className="space-y-1">
                          <strong className="text-white text-xs block truncate max-w-[120px]">{cat?.name}</strong>
                          <span className="font-mono text-[9px] text-slate-500 block truncate max-w-[120px]">Slug: {cat?.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ==============================================================================================================
          🔮 DIÁLOGOS MODALES CRUD
          ============================================================================================================== */}

      {/* 1. MODAL: CRUD PRODUCTOS */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-indigo-500/20 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0 font-sans">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Package className="h-4.5 w-4.5 text-indigo-400" />
                <span>{editingProduct ? `Editar Producto: "${editingProduct.name}"` : 'Agregar Nuevo Producto'}</span>
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveProduct} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs leading-normal font-sans">
              
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre del Producto *</label>
                <input 
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Neon Vaporizer Pro"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción del Producto</label>
                <textarea 
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Especificaciones, sabor, capacidad de batería, etc..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Categoría */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Categoría *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {categories.map((cat, idx) => {
                      if (!cat) return null;
                      return (
                        <option key={cat?.id || `opt-${idx}`} value={cat?.id}>{cat?.name}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Existencias (Stock) *</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    placeholder="25"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Precio Base */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Precio Base ($) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="120.00"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Descuento */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descuento (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={productForm.userDiscount}
                    onChange={(e) => setProductForm({...productForm, userDiscount: e.target.value})}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Imagen */}
              <div className="space-y-2 border-t border-slate-850 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Imagen del Producto *</label>
                  
                  <label className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center space-x-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? "Subiendo..." : "Subir a Storage"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingImage}
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, (url) => setProductForm(p => ({...p, imageUrl: url})))} 
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    required
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                    placeholder="Pegar URL directa de la foto o subir archivo a Storage..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                  />
                </div>

                {productForm.imageUrl.trim() && (
                  <div className="flex items-center space-x-3.5 bg-slate-950/30 border border-slate-850 p-2.5 rounded-xl">
                    <img src={productForm.imageUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover bg-slate-950" />
                    <span className="text-[10px] text-slate-500 truncate max-w-[340px]">{productForm.imageUrl}</span>
                  </div>
                )}
              </div>

              {/* Switches Featured & Available */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3.5">
                <button
                  type="button"
                  onClick={() => setProductForm({...productForm, isFeatured: !productForm.isFeatured})}
                  className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350">Destacar Producto</span>
                  {productForm.isFeatured ? <CheckSquare className="h-4.5 w-4.5 text-purple-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setProductForm({...productForm, isAvailable: !productForm.isAvailable})}
                  className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350">Habilitar en Catálogo</span>
                  {productForm.isAvailable ? <CheckSquare className="h-4.5 w-4.5 text-indigo-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowProductModal(false)} className="font-bold cursor-pointer">
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold cursor-pointer">
                  Guardar Especificaciones
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CRUD COMBOS */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-violet-500/20 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-violet-400" />
                <span>{editingCombo ? `Modificar Combo: "${editingCombo.name}"` : 'Maquetar Nuevo Combo Promocional'}</span>
              </h3>
              <button onClick={() => setShowComboModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveCombo} className="p-6 overflow-y-auto space-y-5 flex-grow text-xs leading-normal">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre del Combo *</label>
                  <input 
                    type="text"
                    required
                    value={comboForm.name}
                    onChange={(e) => setComboForm({...comboForm, name: e.target.value})}
                    placeholder="Mega Starter Pack"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Precio Especial Combo ($) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={comboForm.specialPrice}
                    onChange={(e) => setComboForm({...comboForm, specialPrice: e.target.value})}
                    placeholder="145.00"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all font-mono"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción del Pack Promocional</label>
                  <textarea 
                    rows="2"
                    value={comboForm.description}
                    onChange={(e) => setComboForm({...comboForm, description: e.target.value})}
                    placeholder="Describe los productos que integra..."
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Maquetador */}
              <div className="space-y-3.5 border-t border-slate-850 pt-4 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Maquetador de Artículos Constituyentes</span>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">1. Seleccionar del catálogo:</span>
                    <div className="border border-slate-850 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/30">
                      {products.map((prod) => {
                        if (!prod) return null;
                        return (
                          <div key={prod?.id} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg text-[10px]">
                            <span className="truncate max-w-[140px] font-bold text-slate-200">{prod?.name}</span>
                            <button
                              type="button"
                              onClick={() => addProductIdToCombo(prod?.id)}
                              className="px-2 py-1 rounded bg-violet-500/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-400 hover:text-white transition-all font-bold cursor-pointer"
                            >
                              Agregar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-2 text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">2. Integrados en el Combo:</span>
                    <div className="border border-slate-850 rounded-xl p-2.5 max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/30">
                      {comboForm.productIds.length === 0 ? (
                        <p className="text-[10px] text-slate-650 italic py-4 text-center font-sans">Usa el botón de agregar para poblar el combo.</p>
                      ) : (
                        Object.entries(
                          comboForm.productIds.reduce((acc, curr) => {
                            if (curr) acc[curr] = (acc[curr] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([pid, qty]) => {
                          const p = products.find(prod => prod?.id === pid);
                          return (
                            <div key={pid} className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg text-[10px]">
                              <span className="truncate max-w-[120px] font-bold text-white">{p?.name || 'Artículo'}</span>
                              <div className="flex items-center space-x-2 font-mono">
                                <span className="text-slate-400">Qty: {qty}</span>
                                <button
                                  type="button"
                                  onClick={() => removeProductIdFromCombo(pid)}
                                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {comboForm.productIds.length > 0 && (
                  <div className="bg-violet-500/[0.015] border border-violet-500/10 p-3 rounded-xl flex items-center justify-between text-slate-400 text-[10.5px] font-sans">
                    <div className="space-y-0.5 text-left font-sans">
                      <span>Costo original sugerido (con descuentos del catálogo):</span>
                      <strong className="text-white block font-mono text-xs">${getComboMaquetadoInfo().originalTotal.toFixed(2)}</strong>
                    </div>
                    {getComboMaquetadoInfo().saving > 0 && (
                      <div className="text-right space-y-0.5 font-sans">
                        <span className="text-violet-400 font-bold block uppercase tracking-wider text-[9px] font-sans">¡Mega Ahorro!</span>
                        <strong className="text-violet-300 font-mono">-${getComboMaquetadoInfo().saving.toFixed(2)} ({getComboMaquetadoInfo().savingPct.toFixed(0)}% OFF)</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Imagen Combo */}
              <div className="space-y-2 border-t border-slate-850 pt-3 font-sans">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Imagen del Combo Promocional *</label>
                  
                  <label className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer flex items-center space-x-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? "Subiendo..." : "Subir a Storage"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingImage}
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, (url) => setComboForm(c => ({...c, imageUrl: url})))} 
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    required
                    value={comboForm.imageUrl}
                    onChange={(e) => setComboForm({...comboForm, imageUrl: e.target.value})}
                    placeholder="Pegar URL directa de la foto o subir archivo a Storage..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-650 focus:outline-none focus:border-violet-500 transition-all font-sans"
                  />
                </div>

                {comboForm.imageUrl.trim() && (
                  <div className="flex items-center space-x-3.5 bg-slate-950/30 border border-slate-850 p-2.5 rounded-xl">
                    <img src={comboForm.imageUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover bg-slate-950" />
                    <span className="text-[10px] text-slate-500 truncate max-w-[380px] font-sans">{comboForm.imageUrl}</span>
                  </div>
                )}
              </div>

              {/* Disponible en catálogo switch */}
              <div className="border-t border-slate-850 pt-3.5 font-sans">
                <button
                  type="button"
                  onClick={() => setComboForm({...comboForm, isAvailable: !comboForm.isAvailable})}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850 hover:border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <span className="font-bold text-slate-350 font-sans">Habilitar Combo en la Tienda</span>
                  {comboForm.isAvailable ? <CheckSquare className="h-4.5 w-4.5 text-violet-400" /> : <Square className="h-4.5 w-4.5 text-slate-600" />}
                </button>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0 font-sans">
                <Button variant="outline" size="sm" onClick={() => setShowComboModal(false)} className="font-bold cursor-pointer">
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-violet-600 hover:bg-violet-700 shadow-md font-bold cursor-pointer border-0 text-white">
                  Guardar Configuración Combo
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: CRUD BANNERS */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-emerald-500/20 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all max-h-[90vh] flex flex-col text-left font-sans">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-6 border-b border-slate-850 flex justify-between items-center flex-shrink-0">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Image className="h-4.5 w-4.5 text-emerald-400" />
                <span>{editingBanner ? 'Editar Campaña Publicitaria' : 'Programar Nueva Campaña Hero'}</span>
              </h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveBanner} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs leading-normal">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Título de la Campaña (Principal) *</label>
                  <input 
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    placeholder="ETHEREAL VAPES"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Subtítulo de la Campaña</label>
                  <input 
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})}
                    placeholder="ESFERA PREMIUM"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Descripción / Mensaje Publicitario</label>
                <textarea 
                  rows="2.5"
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                  placeholder="Explica la promoción..."
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Etiqueta de Enlace (Texto del Botón)</label>
                  <input 
                    type="text"
                    value={bannerForm.linkText}
                    onChange={(e) => setBannerForm({...bannerForm, linkText: e.target.value})}
                    placeholder="Explorar Catálogo"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">URL / Path de Redirección</label>
                  <input 
                    type="text"
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({...bannerForm, linkUrl: e.target.value})}
                    placeholder="/products o /combos"
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Imagen de Fondo de Campaña *</label>
                  
                  <label className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center space-x-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? "Subiendo..." : "Subir a Storage"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingImage}
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, (url) => setBannerForm(b => ({...b, imageUrl: url})))} 
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    required
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({...bannerForm, imageUrl: e.target.value})}
                    placeholder="Pegar URL directa de la foto o subir archivo a Storage..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-650 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                </div>

                {bannerForm.imageUrl.trim() && (
                  <div className="flex items-center space-x-3.5 bg-slate-950/30 border border-slate-850 p-2.5 rounded-xl">
                    <img src={bannerForm.imageUrl} alt="preview" className="w-16 h-10 rounded-lg object-cover bg-slate-950" />
                    <span className="text-[10px] text-slate-500 truncate max-w-[340px] font-sans">{bannerForm.imageUrl}</span>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowBannerModal(false)} className="font-bold cursor-pointer">
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans">
                  Programar Banner Campaña
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: CRUD CATEGORÍAS */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-cyan-500/20 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all text-left font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Tag className="h-4.5 w-4.5 text-cyan-400" />
                <span>Agregar Nueva Categoría</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none">×</button>
            </div>

            <form onSubmit={saveCategory} className="p-5 space-y-4 text-xs leading-normal">
              
              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Nombre de la Categoría *</label>
                <input 
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="Vaporizadores o E-Liquids"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Slug / ID único (Opcional)</label>
                <input 
                  type="text"
                  value={categoryForm.id}
                  onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value})}
                  placeholder="vapes o liquids (autogenerado)"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3 font-sans">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Imagen / Icono de Categoría *</label>
                  
                  <label className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center space-x-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingImage ? "Subiendo..." : "Subir a Storage"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingImage}
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, (url) => setCategoryForm(c => ({...c, imageUrl: url})))} 
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input 
                    type="text"
                    required
                    value={categoryForm.imageUrl}
                    onChange={(e) => setCategoryForm({...categoryForm, imageUrl: e.target.value})}
                    placeholder="Pegar URL directa..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-250 placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition-all font-sans"
                  />
                </div>

                {categoryForm.imageUrl.trim() && (
                  <div className="flex items-center space-x-3 bg-slate-950/30 border border-slate-850 p-2 rounded-xl">
                    <img src={categoryForm.imageUrl} alt="preview" className="w-10 h-10 rounded-full object-cover bg-slate-950 border border-slate-800" />
                    <span className="text-[10px] text-slate-500 truncate max-w-[280px] font-sans">{categoryForm.imageUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-850">
                <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(false)} className="font-bold cursor-pointer">
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-cyan-600 hover:bg-cyan-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans">
                  Crear Categoría
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: AJUSTE DE INVENTARIO (FAST STOCK MANAGER) */}
      {showStockModal && stockAdjustmentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0e1326] border border-emerald-500/20 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transform scale-100 transition-all text-left font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Database className="h-4.5 w-4.5 text-emerald-400" />
                <span>Ajustar Inventario</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowStockModal(false)} 
                className="text-slate-450 hover:text-white font-bold p-1 cursor-pointer focus:outline-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-5 space-y-4 text-xs leading-normal">
              
              {/* Info del Producto */}
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl flex items-center space-x-3">
                <img 
                  src={stockAdjustmentProduct.imageUrl} 
                  alt={stockAdjustmentProduct.name} 
                  className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800" 
                />
                <div className="space-y-0.5 truncate">
                  <span className="font-bold text-white block truncate text-xs">{stockAdjustmentProduct.name}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Stock Actual: <strong className="text-white font-mono">{stockAdjustmentProduct.stock} unidades</strong>
                  </span>
                </div>
              </div>

              {/* Acción Selector (Agregar / Retirar) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tipo de Ajuste</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, action: 'add' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                      stockForm.action === 'add'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950/50 border-slate-850 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    Agregar Stock (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockForm({ ...stockForm, action: 'subtract' })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                      stockForm.action === 'subtract'
                        ? 'bg-red-500/10 border-red-500 text-red-400'
                        : 'bg-slate-950/50 border-slate-850 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    Retirar Stock (-)
                  </button>
                </div>
              </div>

              {/* Cantidad a Modificar */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Cantidad de Unidades
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockForm.amount}
                  onChange={(e) => setStockForm({ ...stockForm, amount: e.target.value.replace(/\D/g, '') })}
                  placeholder="Ej: 10"
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>

              {/* Motivo del Ajuste */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Motivo de Ajuste
                </label>
                <select
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-sans text-xs"
                >
                  <option value="Compra/Ingreso de mercadería">Compra/Ingreso de mercadería</option>
                  <option value="Corrección de inventario">Corrección de inventario</option>
                  <option value="Ajuste por merma (Pérdida/Desecho)">Ajuste por merma (Pérdida/Desecho)</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                </select>
              </div>

              {/* Previsualización Reactiva Premium */}
              {stockForm.amount && !isNaN(parseInt(stockForm.amount)) && (
                <div className={`p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] ${
                  stockForm.action === 'add' ? 'bg-emerald-500/[0.015] border-emerald-500/10' : 'bg-red-500/[0.015] border-red-500/10'
                }`}>
                  <span className="text-slate-500 font-bold uppercase">Previsualización:</span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-slate-400">{stockAdjustmentProduct.stock} u.</span>
                    <span className="text-slate-650">➔</span>
                    <span className={`font-bold ${stockForm.action === 'add' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stockForm.action === 'add' ? '+' : '-'}{parseInt(stockForm.amount)} u.
                    </span>
                    <span className="text-slate-650">➔</span>
                    <span className="font-extrabold text-white underline">
                      {stockForm.action === 'add' 
                        ? stockAdjustmentProduct.stock + parseInt(stockForm.amount) 
                        : Math.max(0, stockAdjustmentProduct.stock - parseInt(stockForm.amount))} u.
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Modal */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-850">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowStockModal(false)} 
                  className="font-bold cursor-pointer"
                >
                  Cerrar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold cursor-pointer border-0 text-white font-sans"
                >
                  Ajustar Existencias
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

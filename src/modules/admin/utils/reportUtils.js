/**
 * Utilidades financieras, cálculo de períodos y generación de reportes XML -> PDF
 * para el Panel de Administración ERP de Ethereal Vapes.
 */

export function getOrderDate(order) {
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
}

const VALID_SALE_STATUSES = ['completado', 'confirmado', 'entregado'];

export function isValidSaleOrder(order) {
  return order && VALID_SALE_STATUSES.includes(order.status);
}

export function getPeriodEarnings(orders, daysLimit) {
  const now = new Date();
  if (daysLimit === 0) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (orders || [])
      .filter((o) => isValidSaleOrder(o) && getOrderDate(o) >= startOfToday)
      .reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
  }

  const startDate = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
  return (orders || [])
    .filter((o) => isValidSaleOrder(o) && getOrderDate(o) >= startDate)
    .reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
}

export function getDailyEarningsRange(orders, rangeType) {
  const limit = rangeType === '30days' ? 30 : 7;
  const days = [];
  for (let i = limit - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateLabel:
        limit === 30
          ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
          : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
      dateStr: d.toDateString(),
      earnings: 0
    });
  }

  (orders || [])
    .filter(isValidSaleOrder)
    .forEach((o) => {
      const oDateStr = getOrderDate(o).toDateString();
      const match = days.find((day) => day.dateStr === oDateStr);
      if (match) {
        match.earnings += o?.totalAmount || 0;
      }
    });

  return days;
}

export function getTopRevenueProducts(orders) {
  const salesMap = {};
  (orders || [])
    .filter(isValidSaleOrder)
    .forEach((o) => {
      (o?.items || []).forEach((item) => {
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
        salesMap[key].quantity += item.quantity || 1;
        salesMap[key].revenue += (item.quantity || 1) * (item.price || 0);
      });
    });

  return Object.values(salesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export function getTopSellingProducts(orders) {
  const salesMap = {};
  (orders || [])
    .filter((o) => o?.status === 'completado')
    .forEach((o) => {
      (o?.items || []).forEach((item) => {
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
        salesMap[key].quantity += item.quantity || 1;
        salesMap[key].revenue += (item.quantity || 1) * (item.price || 0);
      });
    });

  return Object.values(salesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export function generateXmlReport(orders) {
  const today = new Date().toLocaleDateString('es-CO');
  const dailyEarnings = getPeriodEarnings(orders, 0);
  const weeklyEarnings = getPeriodEarnings(orders, 7);
  const monthlyEarnings = getPeriodEarnings(orders, 30);
  const rentables = getTopRevenueProducts(orders);
  const completedOrdersList = (orders || []).filter(isValidSaleOrder);
  const totalCompleted = completedOrdersList.length;
  const transferenciaCount = completedOrdersList.filter(
    (o) => o?.paymentMethod === 'transferencia' || o?.paymentMethod === 'whatsapp'
  ).length;
  const efectivoCount = completedOrdersList.filter(
    (o) => o?.paymentMethod === 'efectivo' || (o?.paymentMethod !== 'transferencia' && o?.paymentMethod !== 'whatsapp')
  ).length;
  const totalEarnings = completedOrdersList.reduce((acc, o) => acc + (o?.totalAmount || 0), 0);
  const avgTicket = totalCompleted > 0 ? totalEarnings / totalCompleted : 0;

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
  rentables.forEach((p) => {
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
}

export function printPdfFromXml(orders, onError) {
  try {
    const xmlString = generateXmlReport(orders);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error('Error parsing generated XML document');
    }

    const fecha = xmlDoc.getElementsByTagName('fecha_emision')[0]?.textContent || '';
    const compania = xmlDoc.getElementsByTagName('compania')[0]?.textContent || '';
    const periodo = xmlDoc.getElementsByTagName('periodo')[0]?.textContent || '';

    const ganHoy = xmlDoc.getElementsByTagName('ganancias_hoy')[0]?.textContent || '0.00';
    const ganSemana = xmlDoc.getElementsByTagName('ganancias_semana')[0]?.textContent || '0.00';
    const ganMes = xmlDoc.getElementsByTagName('ganancias_mes')[0]?.textContent || '0.00';
    const ganHist = xmlDoc.getElementsByTagName('ganancias_historicas')[0]?.textContent || '0.00';

    const totalVentas = xmlDoc.getElementsByTagName('total_ventas')[0]?.textContent || '0';
    const ticketPromedio = xmlDoc.getElementsByTagName('ticket_promedio')[0]?.textContent || '0.00';
    const pagosTransferencia =
      xmlDoc.getElementsByTagName('pagos_transferencia')[0]?.textContent ||
      xmlDoc.getElementsByTagName('pagos_whatsapp')[0]?.textContent ||
      '0';
    const pagosEfectivo = xmlDoc.getElementsByTagName('pagos_efectivo')[0]?.textContent || '0';

    const xmlProductos = xmlDoc.getElementsByTagName('producto');
    let productosHtml = '';

    for (let i = 0; i < xmlProductos.length; i++) {
      const prodNode = xmlProductos[i];
      const nombre = prodNode.getElementsByTagName('nombre')[0]?.textContent || '';
      const unidades = prodNode.getElementsByTagName('unidades')[0]?.textContent || '0';
      const ingresos = prodNode.getElementsByTagName('ingresos')[0]?.textContent || '0.00';
      const tipo = prodNode.getElementsByTagName('tipo')[0]?.textContent || 'Producto';
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes (pop-ups) para generar el PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Financiero Mensual - ${compania}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; line-height: 1.5; background-color: #ffffff; }
          .header-table { width: 100%; border-bottom: 3px solid #6d28d9; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .meta { font-size: 11px; color: #64748b; text-align: right; font-weight: bold; text-transform: uppercase; }
          .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 35px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px; background-color: #f8fafc; }
          .kpi-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 5px; letter-spacing: 0.5px; }
          .kpi-value { font-size: 20px; font-weight: bold; color: #0f172a; font-family: monospace; }
          .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; letter-spacing: 0.5px; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          .data-table th { background-color: #f1f5f9; padding: 10px; font-weight: bold; text-transform: uppercase; font-size: 9px; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
          @media print { body { padding: 0; } @page { size: portrait; margin: 1.5cm; } }
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
          <div class="kpi-card"><div class="kpi-title" style="color: #6d28d9;">Cierre Diario</div><div class="kpi-value">$${parseFloat(ganHoy).toFixed(2)}</div></div>
          <div class="kpi-card"><div class="kpi-title" style="color: #4338ca;">Semanal (7d)</div><div class="kpi-value">$${parseFloat(ganSemana).toFixed(2)}</div></div>
          <div class="kpi-card"><div class="kpi-title" style="color: #be185d;">Mensual (30d)</div><div class="kpi-value">$${parseFloat(ganMes).toFixed(2)}</div></div>
          <div class="kpi-card"><div class="kpi-title" style="color: #047857;">Histórico Total</div><div class="kpi-value" style="color: #047857;">$${parseFloat(ganHist).toFixed(2)}</div></div>
        </div>
        <h2 class="section-title">Desglose Operativo y Canales de Venta</h2>
        <table class="data-table">
          <thead><tr><th style="text-align: left;">Métrica / Distribución Comercial</th><th style="text-align: right; width: 250px;">Valor Registrado</th></tr></thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold;">Volumen de Transacciones Exitosas</td><td style="padding: 10px; text-align: right; font-weight: bold;">${totalVentas} órdenes completadas</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold;">Ticket Promedio (Venta Media por Orden)</td><td style="padding: 10px; text-align: right; font-weight: bold; color: #4338ca;">$${parseFloat(ticketPromedio).toFixed(2)} por pedido</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold;">Pedidos cobrados vía Transferencia (WhatsApp)</td><td style="padding: 10px; text-align: right; font-weight: bold;">${pagosTransferencia} órdenes</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold;">Pedidos cobrados en Efectivo (Local/Entrega)</td><td style="padding: 10px; text-align: right; font-weight: bold;">${pagosEfectivo} órdenes</td></tr>
          </tbody>
        </table>
        <h2 class="section-title">Top Productos con Mayor Facturación</h2>
        <table class="data-table">
          <thead><tr><th style="text-align: left;">Descripción del Artículo</th><th style="text-align: left; width: 80px;">Clase</th><th style="text-align: center; width: 110px;">Precio de Venta</th><th style="text-align: center; width: 110px;">Cantidad Vendida</th><th style="text-align: right; width: 140px;">Facturación Bruta</th></tr></thead>
          <tbody>${productosHtml || '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #94a3b8;">No se registran ventas en este periodo.</td></tr>'}</tbody>
        </table>
        <div class="footer">Este reporte fue generado de manera automática por el sistema de facturación y control de inventarios ERP de ${compania}.</div>
        <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 300); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error(err);
    if (onError) onError('Error al generar el reporte XML / PDF: ' + err.message);
  }
}

export function getComboAvailabilityStatus(combo, products) {
  const issues = [];
  let isOutOfStock = false;

  (combo?.productIds || []).forEach((pid) => {
    const p = products.find((prod) => prod?.id === pid);
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
    issues
  };
}

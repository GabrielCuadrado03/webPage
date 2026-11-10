import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  discordEnabled: false,
  discordWebhookUrl: '',
  browserPushEnabled: true,
  browserSoundEnabled: true
};

/**
 * Obtiene la configuración de notificaciones desde Firestore (settings/notifications).
 */
export async function getNotificationSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'notifications'));
    if (snap.exists()) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...snap.data() };
    }
  } catch (err) {
    console.warn('No se pudo leer settings/notifications:', err);
  }
  return { ...DEFAULT_NOTIFICATION_SETTINGS };
}

/**
 * Guarda la configuración de notificaciones en Firestore (settings/notifications).
 */
export async function saveNotificationSettings(settings) {
  const payload = { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
  await setDoc(doc(db, 'settings', 'notifications'), payload, { merge: true });
  return payload;
}

/**
 * Servicio centralizado de notificaciones push/webhooks en tiempo real
 * para alertas instantáneas al administrador cuando ingresa un nuevo pedido.
 * Soporta Telegram Bot API (listo para usar) y Discord Webhooks (preparado).
 */

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatCleanPhoneForWa(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('09') && digits.length === 10) {
    digits = '593' + digits.substring(1);
  } else if (digits.startsWith('9') && digits.length === 9) {
    digits = '593' + digits;
  }
  return digits;
}

/**
 * Construye el mensaje HTML estructurado para Telegram.
 */
export function buildTelegramOrderMessage(order, orderId) {
  const shortId = (orderId || 'LOCAL').substring(0, 6).toUpperCase();
  const waDigits = formatCleanPhoneForWa(order.customerPhone);
  const waLink = waDigits ? `https://wa.me/${waDigits}` : null;
  const paymentLabel =
    order.paymentMethod === 'transferencia'
      ? '🏦 Transferencia Bancaria'
      : '💵 Efectivo contra entrega';

  const itemsLines = (order.items || [])
    .map((item) => {
      const qty = item.quantity || 1;
      const lineTotal = ((item.price || 0) * qty).toFixed(2);
      const comboBadge = item.isCombo ? ' <i>[Combo]</i>' : '';
      return `  • <b>${qty}x</b> ${escapeHtml(item.name)}${comboBadge} — <code>$${lineTotal}</code>`;
    })
    .join('\n');

  const lines = [
    `🚨 <b>¡NUEVO PEDIDO RECIBIDO!</b> 🚨`,
    ``,
    `🆔 <b>Pedido:</b> <code>#${escapeHtml(shortId)}</code>`,
    `👤 <b>Cliente:</b> ${escapeHtml(order.customerName)}`,
    waLink
      ? `📱 <b>WhatsApp:</b> <a href="${waLink}">${escapeHtml(order.customerPhone)}</a>`
      : `📱 <b>WhatsApp:</b> ${escapeHtml(order.customerPhone)}`,
    `📍 <b>Dirección:</b> ${escapeHtml(order.customerAddress)}`,
    `💳 <b>Pago:</b> ${paymentLabel}`,
    ``,
    `🛍️ <b>Productos:</b>`,
    itemsLines || '  • Sin detalle de ítems',
    ``,
    `💰 <b>TOTAL A COBRAR:</b> <b>$${Number(order.totalAmount || 0).toFixed(2)} USD</b>`,
    ``,
    `⚡ <i>Revisa el Panel Admin para confirmar stock y despachar.</i>`
  ];

  return lines.join('\n');
}

/**
 * Envía un mensaje vía Telegram Bot API.
 */
export async function sendTelegramNotification(botToken, chatId, htmlMessage) {
  if (!botToken || !chatId) {
    return { success: false, error: 'Falta Bot Token o Chat ID de Telegram.' };
  }

  try {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return {
        success: false,
        error: data.description || `Error HTTP ${response.status} al enviar a Telegram.`
      };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Error de red enviando a Telegram.' };
  }
}

/**
 * Construye el Embed profesional para Discord Webhook (preparado para futuro uso).
 */
export function buildDiscordOrderPayload(order, orderId) {
  const shortId = (orderId || 'LOCAL').substring(0, 6).toUpperCase();
  const paymentLabel =
    order.paymentMethod === 'transferencia'
      ? '🏦 Transferencia Bancaria'
      : '💵 Efectivo contra entrega';

  const itemsText = (order.items || [])
    .map((item) => {
      const qty = item.quantity || 1;
      const lineTotal = ((item.price || 0) * qty).toFixed(2);
      return `• **${qty}x** ${item.name} — \`$${lineTotal}\``;
    })
    .join('\n') || 'Sin detalle';

  return {
    username: 'Ethereal Vapes • Alertas',
    embeds: [
      {
        title: `🚨 Nuevo Pedido #${shortId}`,
        description: `Ha ingresado un nuevo pedido en la tienda web.`,
        color: 16711765, // #ff0055
        fields: [
          { name: '👤 Cliente', value: order.customerName || 'N/A', inline: true },
          { name: '📱 WhatsApp', value: order.customerPhone || 'N/A', inline: true },
          { name: '💳 Método de Pago', value: paymentLabel, inline: true },
          { name: '📍 Dirección de Envío', value: order.customerAddress || 'N/A', inline: false },
          { name: '🛍️ Detalle de Compra', value: itemsText, inline: false },
          {
            name: '💰 Total del Pedido',
            value: `**$${Number(order.totalAmount || 0).toFixed(2)} USD**`,
            inline: false
          }
        ],
        footer: {
          text: 'Ethereal Vapes Web • Sistema de Pedidos'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Envía una notificación a un Webhook de Discord.
 */
export async function sendDiscordNotification(webhookUrl, payload) {
  if (!webhookUrl) {
    return { success: false, error: 'Falta la URL del Webhook de Discord.' };
  }

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Discord devolvió HTTP ${response.status}. Verifica la URL del webhook.`
      };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Error de red enviando a Discord.' };
  }
}

/**
 * Dispara todas las notificaciones configuradas y habilitadas al crearse un pedido.
 * Nunca lanza excepción para no interrumpir la experiencia de compra del cliente.
 */
export async function notifyNewOrder(order, orderId, notificationSettings) {
  if (!notificationSettings) return;

  const tasks = [];

  if (
    notificationSettings.telegramEnabled &&
    notificationSettings.telegramBotToken &&
    notificationSettings.telegramChatId
  ) {
    const msg = buildTelegramOrderMessage(order, orderId);
    tasks.push(
      sendTelegramNotification(
        notificationSettings.telegramBotToken,
        notificationSettings.telegramChatId,
        msg
      )
    );
  }

  if (notificationSettings.discordEnabled && notificationSettings.discordWebhookUrl) {
    const payload = buildDiscordOrderPayload(order, orderId);
    tasks.push(sendDiscordNotification(notificationSettings.discordWebhookUrl, payload));
  }

  if (tasks.length === 0) return;

  try {
    const results = await Promise.allSettled(tasks);
    results.forEach((res) => {
      if (res.status === 'fulfilled' && !res.value?.success) {
        console.warn('OrderNotifier warning:', res.value?.error);
      }
    });
  } catch (e) {
    console.warn('OrderNotifier error:', e);
  }
}

/**
 * Envía una alerta de prueba simulada desde el Panel de Administración.
 */
export async function testNotificationChannel(channel, settings) {
  const sampleOrder = {
    customerName: 'Cliente de Prueba',
    customerPhone: '+593 99 000 0000',
    customerAddress: 'Av. República del Salvador, Quito (PRUEBA DEL SISTEMA)',
    paymentMethod: 'transferencia',
    totalAmount: 42.5,
    items: [
      { name: 'Geek Bar Pulse 15K (Prueba)', quantity: 1, price: 24.5, isCombo: false },
      { name: 'Pack Dúo Premium (Prueba)', quantity: 1, price: 18.0, isCombo: true }
    ]
  };

  if (channel === 'telegram') {
    const html =
      `🧪 <b>MENSAJE DE PRUEBA - ETHEREAL VAPES</b>\n\n` +
      buildTelegramOrderMessage(sampleOrder, 'TEST88');
    return await sendTelegramNotification(
      settings.telegramBotToken,
      settings.telegramChatId,
      html
    );
  }

  if (channel === 'discord') {
    const payload = buildDiscordOrderPayload(sampleOrder, 'TEST88');
    payload.embeds[0].title = '🧪 PRUEBA DE CONEXIÓN — Nuevo Pedido #TEST88';
    return await sendDiscordNotification(settings.discordWebhookUrl, payload);
  }

  return { success: false, error: 'Canal de notificación no soportado.' };
}

/**
 * Reproduce un sonido sutil de caja registradora / notificación usando Web Audio API
 * sin depender de archivos de audio externos.
 */
export function playOrderAlertSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.14); // D5
    playTone(880.0, now + 0.12, 0.25); // A5
  } catch (e) {
    // Silenciar si el navegador bloquea autoplay sin interacción previa
  }
}

/**
 * Muestra una notificación Push nativa del navegador (si el administrador concedió permiso).
 */
export function showBrowserPushNotification(order, orderId) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const shortId = (orderId || '').substring(0, 6).toUpperCase();
    const total = Number(order.totalAmount || 0).toFixed(2);
    new Notification(`🚨 Nuevo Pedido #${shortId} — $${total}`, {
      body: `${order.customerName || 'Cliente'} • ${(order.productsPurchased || []).join(', ') || 'Productos'}`,
      icon: '/images/logo.png',
      tag: `order-${orderId}`
    });
  } catch (e) {
    // Silenciar si el navegador no soporta constructor directo de Notification
  }
}


import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  testNotificationChannel,
  playOrderAlertSound
} from '../../../services/orderNotifier';
import {
  Bell,
  Send,
  Save,
  Check,
  AlertCircle,
  Volume2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function NotificationsTab({ onSettingsUpdated }) {
  const [form, setForm] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingChannel, setTestingChannel] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    let active = true;
    getNotificationSettings().then((data) => {
      if (active) {
        setForm(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);
    try {
      const saved = await saveNotificationSettings(form);
      setForm(saved);
      if (onSettingsUpdated) onSettingsUpdated(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setTestResult({ ok: false, message: 'Error guardando configuración: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel) => {
    setTestingChannel(channel);
    setTestResult(null);
    try {
      const res = await testNotificationChannel(channel, form);
      if (res.success) {
        setTestResult({
          ok: true,
          message:
            channel === 'telegram'
              ? '¡Mensaje de prueba enviado a tu Telegram! Revisa tu chat.'
              : '¡Embed de prueba enviado a tu canal de Discord!'
        });
      } else {
        setTestResult({ ok: false, message: res.error || 'No se pudo enviar la prueba.' });
      }
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTestingChannel(null);
    }
  };

  const requestBrowserPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    if (permission === 'granted') {
      new Notification('🔔 Alertas Activadas — Ethereal Vapes', {
        body: 'Recibirás una notificación instantánea cada vez que entre un nuevo pedido.',
        icon: '/images/logo.png'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs">
        Cargando configuración de alertas y webhooks...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* HEADER PRINCIPAL */}
      <div className="bg-[#0f1424]/60 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Bell className="h-5 w-5" />
            </span>
            <h3 className="font-extrabold text-white text-base">Centro de Notificaciones Push & Webhooks</h3>
          </div>
          <p className="text-xs text-slate-400">
            Entérate al instante cada vez que un cliente realice un pedido, incluso si no llega a pulsar el botón de WhatsApp.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          variant="primary"
          size="sm"
          className="bg-[#00d2ff] hover:bg-[#00b4db] text-slate-950 font-black shadow-md flex items-center space-x-2 border-0 cursor-pointer shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Ajustes'}</span>
        </Button>
      </div>

      {/* FEEDBACK DE GUARDADO / PRUEBA */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="h-4 w-4 shrink-0" />
          <span className="font-bold">¡Configuración de notificaciones guardada en la nube con éxito!</span>
        </div>
      )}

      {testResult && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border animate-fadeIn ${
            testResult.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {testResult.ok ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="font-bold">{testResult.message}</span>
        </div>
      )}

      {/* 1. TARJETA TELEGRAM BOT */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-white text-sm">Alertas Instantáneas en Telegram</h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                  Activo / Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recibe nombre, enlace directo a WhatsApp del cliente, dirección y productos al segundo.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!form.telegramEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, telegramEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Guía rápida desplegable */}
        <div>
          <button
            type="button"
            onClick={() => setShowTelegramGuide((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showTelegramGuide ? 'Ocultar guía de configuración rápida' : '¿Cómo obtener mi Bot Token y Chat ID en 1 minuto?'}</span>
          </button>

          {showTelegramGuide && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-950/70 border border-sky-500/20 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p><strong>1. Crear tu Bot:</strong> Abre Telegram, busca <code>@BotFather</code>, envíale <code>/newbot</code>, ponle un nombre (ej: <em>Ethereal Pedidos</em>) y copia el <strong>Token</strong> largo que te entrega.</p>
              <p><strong>2. Activar el Chat:</strong> Busca tu nuevo bot en Telegram y dale clic en <strong>Iniciar / Start</strong> (muy importante para que pueda escribirte).</p>
              <p><strong>3. Obtener tu Chat ID:</strong> Busca el bot <code>@userinfobot</code> en Telegram, dale Iniciar y te dirá tu número de <strong>Id</strong> (ej: <code>123456789</code>). ¡Pégalo abajo!</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Telegram Bot Token
            </label>
            <input
              type="password"
              value={form.telegramBotToken || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
              placeholder="Ej: 7123456789:AAHxyz..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Telegram Chat ID (Tu usuario o grupo)
            </label>
            <input
              type="text"
              value={form.telegramChatId || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, telegramChatId: e.target.value }))}
              placeholder="Ej: 987654321 o -100123456789"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testingChannel === 'telegram' || !form.telegramBotToken || !form.telegramChatId}
            onClick={() => handleTest('telegram')}
            className="text-sky-400 border-sky-500/30 hover:bg-sky-500/10 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{testingChannel === 'telegram' ? 'Enviando...' : 'Enviar Mensaje de Prueba a Telegram'}</span>
          </Button>
        </div>
      </div>

      {/* 2. TARJETA DISCORD WEBHOOK (PREPARADA PARA FUTURO) */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-white text-sm">Discord Webhook</h4>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider">
                  Preparado / Opcional
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Listo para cuando tengas un canal privado de ventas en Discord. Solo pega tu URL de Webhook y activa el switch.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!form.discordEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, discordEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            URL del Webhook de Discord
          </label>
          <input
            type="url"
            value={form.discordWebhookUrl || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, discordWebhookUrl: e.target.value }))}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1.5">
            En Discord: Ajustes del Canal ➔ Integraciones ➔ Webhooks ➔ Nuevo Webhook ➔ Copiar URL.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testingChannel === 'discord' || !form.discordWebhookUrl}
            onClick={() => handleTest('discord')}
            className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{testingChannel === 'discord' ? 'Enviando...' : 'Probar Webhook de Discord'}</span>
          </Button>
        </div>
      </div>

      {/* 3. NOTIFICACIONES PUSH EN NAVEGADOR Y SONIDO */}
      <div className="bg-[#0f1424]/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <Volume2 className="h-4.5 w-4.5 text-amber-400" />
          <h4 className="font-extrabold text-white text-sm">Alertas en Tiempo Real dentro del Navegador (Panel Abierto)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Sonido al recibir pedido nuevo</p>
              <p className="text-[11px] text-slate-400">Suena un timbre sutil si estás en el Panel Admin</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playOrderAlertSound}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-amber-400 hover:text-white cursor-pointer"
              >
                Oír
              </button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.browserSoundEnabled ?? true}
                  onChange={(e) => setForm((prev) => ({ ...prev, browserSoundEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Notificaciones Push del Navegador</p>
              <p className="text-[11px] text-slate-400">
                Estado actual:{' '}
                <strong className={browserPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                  {browserPermission === 'granted' ? 'Permitidas' : browserPermission === 'denied' ? 'Bloqueadas' : 'Sin permiso'}
                </strong>
              </p>
            </div>

            {browserPermission !== 'granted' && browserPermission !== 'unsupported' ? (
              <Button
                type="button"
                size="sm"
                onClick={requestBrowserPushPermission}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold border-0 cursor-pointer"
              >
                Activar Push
              </Button>
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.browserPushEnabled ?? true}
                  onChange={(e) => setForm((prev) => ({ ...prev, browserPushEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

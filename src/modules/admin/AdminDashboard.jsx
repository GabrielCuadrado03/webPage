import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../config/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Button from '../../components/Button';
import { getPlaceholderImage } from '../../utils/placeholders';
import { getComboAvailabilityStatus } from './utils/reportUtils';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  playOrderAlertSound,
  showBrowserPushNotification
} from '../../services/orderNotifier';

import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import InventoryTab from './components/InventoryTab';
import ProductsTab from './components/ProductsTab';
import CombosTab from './components/CombosTab';
import BannersTab from './components/BannersTab';
import CategoriesTab from './components/CategoriesTab';
import NotificationsTab from './components/NotificationsTab';
import AdminModals from './components/AdminModals';

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  LogOut,
  ShieldAlert,
  Database,
  AlertTriangle,
  Check,
  Megaphone,
  Bell
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Navegación interna ERP
  const [activeSection, setActiveSection] = useState('dashboard');

  // Datos en tiempo real
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [users, setUsers] = useState([]);

  // Estados de carga
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Ajustes de alertas en vivo dentro del panel
  const notifSettingsRef = useRef(DEFAULT_NOTIFICATION_SETTINGS);
  const isInitialOrdersLoad = useRef(true);

  useEffect(() => {
    getNotificationSettings().then((cfg) => {
      notifSettingsRef.current = cfg;
    });
  }, []);

  // Estados de modales y formularios CRUD
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
    productIds: []
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
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', imageUrl: '' });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    action: 'add',
    amount: '',
    reason: 'Compra/Ingreso de mercadería'
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (err) {
      console.error('Error al cerrar sesión ERP:', err);
    }
  };

  // ========================================================
  // LISTENERS EN TIEMPO REAL CON FIRESTORE
  // ========================================================

  // 1. Pedidos + Alerta sonora/push en vivo para pedidos entrantes
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!isInitialOrdersLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newOrder = change.doc.data();
              if (newOrder?.status === 'pendiente') {
                if (notifSettingsRef.current?.browserSoundEnabled !== false) {
                  playOrderAlertSound();
                }
                if (notifSettingsRef.current?.browserPushEnabled !== false) {
                  showBrowserPushNotification(newOrder, change.doc.id);
                }
              }
            }
          });
        }
        isInitialOrdersLoad.current = false;

        const ordersList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            ordersList.push({
              id: docSnap.id,
              ...data,
              createdAtFormatted: data.createdAt?.toDate()?.toLocaleString('es-CO') || 'Fecha cargando...'
            });
          }
        });
        setOrders(ordersList);
        setLoadingOrders(false);
      },
      (error) => {
        console.warn('Firestore orders listen error:', error);
        setOrders([]);
        setLoadingOrders(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Productos
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const prodList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            prodList.push({
              id: docSnap.id,
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
      },
      (error) => {
        console.warn('Firestore products listen error:', error);
        setProducts([]);
        setLoadingProducts(false);
      }
    );
    return () => unsub();
  }, []);

  // 3. Combos
  useEffect(() => {
    const q = query(collection(db, 'combos'), orderBy('name', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const combosList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            combosList.push({
              id: docSnap.id,
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
      },
      (error) => {
        console.warn('Firestore combos listen error:', error);
        setCombos([]);
        setLoadingCombos(false);
      }
    );
    return () => unsub();
  }, []);

  // 4. Categorías
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const catList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            catList.push({
              id: docSnap.id,
              name: data.name || 'Categoría',
              imageUrl: data.imageUrl || getPlaceholderImage(data.name || 'Categoría')
            });
          }
        });
        setCategories(catList);
        setLoadingCategories(false);
      },
      (error) => {
        console.warn('Firestore categories listen error:', error);
        setCategories([]);
        setLoadingCategories(false);
      }
    );
    return () => unsub();
  }, []);

  // 5. Banners
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('title', 'asc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const bannersList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            bannersList.push({
              id: docSnap.id,
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
      },
      (error) => {
        console.warn('Firestore banners listen error:', error);
        setBanners([]);
        setLoadingBanners(false);
      }
    );
    return () => unsub();
  }, []);

  // 6. Logs de Inventario
  useEffect(() => {
    const q = query(collection(db, 'inventory_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const logsList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            logsList.push({
              id: docSnap.id,
              ...data,
              timestampFormatted: data.timestamp?.toDate()?.toLocaleString('es-CO') || 'Justo ahora'
            });
          }
        });
        setInventoryLogs(logsList);
        setLoadingLogs(false);
      },
      (error) => {
        console.warn('Firestore inventory logs error:', error);
        setInventoryLogs([]);
        setLoadingLogs(false);
      }
    );
    return () => unsub();
  }, []);

  // 7. Usuarios
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const usersList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            usersList.push({
              id: docSnap.id,
              email: data.email || 'N/A',
              role: data.role || 'usuario',
              displayName: data.displayName || data.name || 'Usuario Ethereal',
              createdAtFormatted: data.createdAt?.toDate()?.toLocaleDateString('es-CO') || 'N/A'
            });
          }
        });
        setUsers(usersList);
      },
      (error) => {
        console.warn('Firestore users error:', error);
        setUsers([]);
      }
    );
    return () => unsub();
  }, []);

  // ========================================================
  // SUBIDA DE IMÁGENES Y TRANSACCIONES DE STOCK / PEDIDOS
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
      setSuccessMsg('¡Archivo subido exitosamente a Firebase Storage!');
    } catch (err) {
      console.error('Storage upload error:', err);
      setErrorMsg('No se pudo subir la foto a Firebase Storage. Verifica las reglas de Storage o pega directamente una URL de red.');
    } finally {
      setUploadingImage(false);
    }
  };

  const openStockAdjustment = (prod) => {
    if (!prod) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setStockAdjustmentProduct(prod);
    setStockForm({ action: 'add', amount: '', reason: 'Compra/Ingreso de mercadería' });
    setShowStockModal(true);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const { action, amount, reason } = stockForm;
    const qty = parseInt(amount);
    if (!amount.trim() || isNaN(qty) || qty <= 0) {
      setErrorMsg('Por favor ingresa una cantidad numérica válida mayor a 0.');
      return;
    }

    const change = action === 'add' ? qty : -qty;
    const oldStock = stockAdjustmentProduct.stock;
    const newStock = oldStock + change;

    if (newStock < 0) {
      setErrorMsg('El stock resultante no puede ser negativo.');
      return;
    }

    try {
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
      const productRef = doc(db, 'products', stockAdjustmentProduct.id);

      await runTransaction(db, async (transaction) => {
        const prodSnap = await transaction.get(productRef);
        if (!prodSnap.exists()) throw new Error('El producto ya no existe.');
        transaction.update(productRef, {
          stock: newStock,
          isAvailable: newStock > 0 ? stockAdjustmentProduct.isAvailable : false
        });
      });

      await addDoc(collection(db, 'inventory_logs'), {
        productId: stockAdjustmentProduct.id,
        productName: stockAdjustmentProduct.name,
        changeAmount: change,
        previousStock: oldStock,
        newStock,
        adjustedBy: adminName,
        timestamp: serverTimestamp(),
        reason: reason.trim() || 'Ajuste manual del Administrador'
      });

      setSuccessMsg(`Inventario de "${stockAdjustmentProduct.name}" ajustado con éxito (${change > 0 ? '+' : ''}${change} un. / Nuevo stock: ${newStock} un.).`);
      setShowStockModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al ajustar el inventario.');
    }
  };

  const confirmOrder = async (order) => {
    if (!order || order.status !== 'pendiente') return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoading(order.id);

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error('El pedido no existe.');
        if (orderSnap.data().status !== 'pendiente') throw new Error('Este pedido ya ha sido procesado.');

        const stockDeductions = {};
        for (const item of order.items || []) {
          if (!item) continue;
          const qty = item.quantity || 1;
          if (item.isCombo) {
            (item.productIds || []).forEach((pid) => {
              if (pid) stockDeductions[pid] = (stockDeductions[pid] || 0) + qty;
            });
          } else if (item.productId) {
            stockDeductions[item.productId] = (stockDeductions[item.productId] || 0) + qty;
          }
        }

        const productSnapshots = {};
        for (const pid of Object.keys(stockDeductions)) {
          const productRef = doc(db, 'products', pid);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw new Error(`El producto con ID '${pid}' no existe en el catálogo.`);
          productSnapshots[pid] = { snap: productSnap, ref: productRef };
        }

        const validationErrors = [];
        for (const pid of Object.keys(stockDeductions)) {
          const requiredQty = stockDeductions[pid];
          const productData = productSnapshots[pid].snap.data();
          const currentStock = typeof productData.stock === 'number' ? productData.stock : 0;
          if (currentStock < requiredQty) {
            validationErrors.push(`"${productData.name || 'Producto Desconocido'}" (Disponible: ${currentStock}, Requerido: ${requiredQty})`);
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

          transaction.update(productRef, { stock: newStock });
          batchLogs.push({
            productId: pid,
            productName: productData.name || 'Producto Desconocido',
            changeAmount: -deductQty,
            previousStock: oldStock,
            newStock,
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
      setErrorMsg(err.message || 'Error al procesar el pedido.');
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
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelado',
        acceptedBy: adminName,
        cancelledAt: serverTimestamp()
      });
      setSuccessMsg(`Pedido #${orderId.substring(0, 6).toUpperCase()} cancelado con éxito.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al cancelar la orden.');
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
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'entregado',
        acceptedBy: adminName,
        deliveredAt: serverTimestamp()
      });
      setSuccessMsg(`Pedido #${orderId.substring(0, 6).toUpperCase()} marcado como entregado con éxito.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al marcar como entregado.');
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================================
  // OPERACIONES CRUD: CATEGORÍAS / PRODUCTOS / COMBOS / BANNERS
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
      setErrorMsg('Nombre e Imagen son campos obligatorios.');
      return;
    }
    const docId = (id.trim() || name.trim()).toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'categories', docId), { name: name.trim(), imageUrl: imageUrl.trim() });
      setSuccessMsg(`Categoría "${name}" guardada con éxito.`);
      setShowCategoryModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar la categoría.');
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
      setErrorMsg('Error al eliminar la categoría.');
    }
  };

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
      setErrorMsg('Nombre, Precio, Stock, Imagen y Categoría son requeridos.');
      return;
    }

    const priceVal = parseFloat(price);
    const discountVal = parseFloat(userDiscount || 0);
    const stockVal = parseInt(stock);
    if (isNaN(priceVal) || priceVal < 0 || isNaN(discountVal) || discountVal < 0 || isNaN(stockVal) || stockVal < 0) {
      setErrorMsg('Asegúrate de ingresar valores numéricos válidos y no negativos en Precio, Descuento y Stock.');
      return;
    }

    const productPayload = {
      name: name.trim(),
      description: description.trim(),
      price: priceVal,
      userDiscount: discountVal,
      stock: stockVal,
      imageUrl: imageUrl.trim(),
      categoryId,
      isFeatured: !!isFeatured,
      isAvailable: !!isAvailable && stockVal > 0
    };

    try {
      const adminName = userProfile?.name || currentUser?.email || 'Administrador Web';
      if (editingProduct) {
        const oldStock = editingProduct.stock;
        if (oldStock !== stockVal) {
          await addDoc(collection(db, 'inventory_logs'), {
            productId: editingProduct.id,
            productName: name.trim(),
            changeAmount: stockVal - oldStock,
            previousStock: oldStock,
            newStock: stockVal,
            adjustedBy: adminName,
            timestamp: serverTimestamp(),
            reason: 'Ajuste manual del Administrador'
          });
        }
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        setSuccessMsg(`Producto "${name}" modificado con éxito.`);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productPayload);
        await addDoc(collection(db, 'inventory_logs'), {
          productId: docRef.id,
          productName: name.trim(),
          changeAmount: stockVal,
          previousStock: 0,
          newStock: stockVal,
          adjustedBy: adminName,
          timestamp: serverTimestamp(),
          reason: 'Creación del Producto'
        });
        setSuccessMsg(`Producto "${name}" creado exitosamente.`);
      }
      setShowProductModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al guardar el producto.');
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
      setErrorMsg('Error al borrar el producto.');
    }
  };

  const openCreateCombo = () => {
    setErrorMsg(null);
    setEditingCombo(null);
    setComboForm({ name: '', description: '', specialPrice: '', imageUrl: '', isAvailable: true, productIds: [] });
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
      setErrorMsg('Nombre, Precio Especial e Imagen son requeridos.');
      return;
    }
    if (productIds.length === 0) {
      setErrorMsg('Debes agregar al menos 1 producto constituyente al combo promocional.');
      return;
    }
    const priceVal = parseFloat(specialPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMsg('Precio especial inválido.');
      return;
    }

    const comboPayload = {
      name: name.trim(),
      description: description.trim(),
      specialPrice: priceVal,
      imageUrl: imageUrl.trim(),
      isAvailable: !!isAvailable,
      productIds
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
      setErrorMsg('Error al guardar el combo.');
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
      setErrorMsg('Error al borrar el combo.');
    }
  };

  const addProductIdToCombo = (pid) => {
    if (!pid) return;
    setComboForm((prev) => ({ ...prev, productIds: [...prev.productIds, pid] }));
  };

  const removeProductIdFromCombo = (pid) => {
    if (!pid) return;
    setComboForm((prev) => {
      const idx = prev.productIds.indexOf(pid);
      if (idx === -1) return prev;
      const newProductIds = [...prev.productIds];
      newProductIds.splice(idx, 1);
      return { ...prev, productIds: newProductIds };
    });
  };

  const getComboMaquetadoInfo = () => {
    let originalTotal = 0;
    comboForm.productIds.forEach((pid) => {
      const p = products.find((prod) => prod?.id === pid);
      if (p) originalTotal += p.price * (1 - p.userDiscount / 100);
    });
    const specPrice = parseFloat(comboForm.specialPrice) || 0;
    const saving = originalTotal > specPrice ? originalTotal - specPrice : 0;
    const savingPct = originalTotal > 0 ? (saving / originalTotal) * 100 : 0;
    return { originalTotal, saving, savingPct };
  };

  const openCreateBanner = () => {
    setErrorMsg(null);
    setEditingBanner(null);
    setBannerForm({ title: '', subtitle: '', description: '', imageUrl: '', linkText: 'Ver Más', linkUrl: '/products' });
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
      setErrorMsg('Título e Imagen de fondo son requeridos.');
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
        setSuccessMsg('Banner de campaña actualizado.');
      } else {
        await addDoc(collection(db, 'banners'), bannerPayload);
        setSuccessMsg('Banner de campaña creado.');
      }
      setShowBannerModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar el banner.');
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
      setErrorMsg('Error al eliminar el banner.');
    }
  };

  // Métricas y colecciones derivadas
  const activeOrders = (orders || []).filter((o) => o && (o.status === 'pendiente' || o.status === 'confirmado'));
  const historyOrders = (orders || []).filter((o) => o && (o.status === 'completado' || o.status === 'entregado' || o.status === 'cancelado'));

  const metrics = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter((o) => o?.status === 'pendiente')?.length || 0,
    completedOrders: orders?.filter((o) => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado')?.length || 0,
    totalProducts: products?.length || 0,
    totalEarnings: (orders || [])
      .filter((o) => o?.status === 'completado' || o?.status === 'confirmado' || o?.status === 'entregado')
      .reduce((acc, o) => acc + (o?.totalAmount || 0), 0)
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, count: 0, activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'orders', name: 'Pedidos', icon: ShoppingBag, count: activeOrders.length, activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { id: 'inventory', name: 'Inventario', icon: Database, count: products.filter((p) => (p.stock || 0) < 5).length, activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'products', name: 'Productos', icon: Package, count: 0, activeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { id: 'combos', name: 'Combos Promos', icon: Layers, count: combos.filter((c) => getComboAvailabilityStatus(c, products).isOutOfStock).length, activeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { id: 'banners', name: 'Campañas & Avisos', icon: Megaphone, count: 0, activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'categories', name: 'Categorías', icon: Tag, count: 0, activeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { id: 'notifications', name: 'Notificaciones', icon: Bell, count: 0, activeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20' }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 text-left text-slate-100 relative min-h-[75vh]">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none z-0 print:hidden" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0 print:hidden" />

      {/* MENÚ LATERAL ERP */}
      <aside className="w-full lg:w-64 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between space-y-8 z-10 flex-shrink-0 print:hidden">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-850">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <ShieldAlert className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold tracking-widest text-xs uppercase text-slate-200">ETHEREAL ERP</span>
          </div>

          <nav className="flex flex-col space-y-1.5">
            {navItems.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setActiveSection(sec.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSection === sec.id ? `${sec.activeColor} border` : 'border-transparent text-slate-450 hover:text-slate-200 hover:bg-slate-950/30'
                }`}
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

      {/* CONTENIDO PRINCIPAL */}
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

        {activeSection === 'dashboard' && (
          <DashboardTab
            orders={orders}
            products={products}
            users={users}
            metrics={metrics}
            setActiveSection={setActiveSection}
            openStockAdjustment={openStockAdjustment}
            setErrorMsg={setErrorMsg}
          />
        )}

        {activeSection === 'orders' && (
          <OrdersTab
            orders={orders}
            activeOrders={activeOrders}
            historyOrders={historyOrders}
            metrics={metrics}
            loadingOrders={loadingOrders}
            expandedOrders={expandedOrders}
            toggleExpand={toggleExpand}
            actionLoading={actionLoading}
            confirmOrder={confirmOrder}
            deliverOrder={deliverOrder}
            cancelOrder={cancelOrder}
          />
        )}

        {activeSection === 'inventory' && (
          <InventoryTab
            products={products}
            categories={categories}
            inventoryLogs={inventoryLogs}
            metrics={metrics}
            loadingProducts={loadingProducts}
            loadingLogs={loadingLogs}
            openStockAdjustment={openStockAdjustment}
          />
        )}

        {activeSection === 'products' && (
          <ProductsTab
            products={products}
            categories={categories}
            loadingProducts={loadingProducts}
            openCreateProduct={openCreateProduct}
            openEditProduct={openEditProduct}
            deleteProduct={deleteProduct}
          />
        )}

        {activeSection === 'combos' && (
          <CombosTab
            combos={combos}
            products={products}
            loadingCombos={loadingCombos}
            openCreateCombo={openCreateCombo}
            openEditCombo={openEditCombo}
            deleteCombo={deleteCombo}
          />
        )}

        {activeSection === 'banners' && (
          <BannersTab
            banners={banners}
            loadingBanners={loadingBanners}
            openCreateBanner={openCreateBanner}
            openEditBanner={openEditBanner}
            deleteBanner={deleteBanner}
          />
        )}

        {activeSection === 'categories' && (
          <CategoriesTab
            categories={categories}
            loadingCategories={loadingCategories}
            openCreateCategory={openCreateCategory}
            deleteCategory={deleteCategory}
          />
        )}

        {activeSection === 'notifications' && (
          <NotificationsTab
            onSettingsUpdated={(updatedCfg) => {
              notifSettingsRef.current = updatedCfg;
            }}
          />
        )}
      </main>

      <AdminModals
        showProductModal={showProductModal}
        setShowProductModal={setShowProductModal}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        saveProduct={saveProduct}
        categories={categories}
        showComboModal={showComboModal}
        setShowComboModal={setShowComboModal}
        editingCombo={editingCombo}
        comboForm={comboForm}
        setComboForm={setComboForm}
        saveCombo={saveCombo}
        products={products}
        addProductIdToCombo={addProductIdToCombo}
        removeProductIdFromCombo={removeProductIdFromCombo}
        getComboMaquetadoInfo={getComboMaquetadoInfo}
        showBannerModal={showBannerModal}
        setShowBannerModal={setShowBannerModal}
        editingBanner={editingBanner}
        bannerForm={bannerForm}
        setBannerForm={setBannerForm}
        saveBanner={saveBanner}
        showCategoryModal={showCategoryModal}
        setShowCategoryModal={setShowCategoryModal}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        saveCategory={saveCategory}
        showStockModal={showStockModal}
        setShowStockModal={setShowStockModal}
        stockAdjustmentProduct={stockAdjustmentProduct}
        stockForm={stockForm}
        setStockForm={setStockForm}
        handleStockAdjustment={handleStockAdjustment}
        uploadingImage={uploadingImage}
        handleImageUpload={handleImageUpload}
      />
    </div>
  );
}

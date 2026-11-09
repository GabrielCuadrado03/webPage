import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  
  // Inicializar estado del carrito leyendo desde localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('ethereal_vapes_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Error al parsear el carrito desde localStorage:', e);
      return [];
    }
  });

  // Estado local de productos para validación de stock en tiempo real
  const [dbProducts, setDbProducts] = useState([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        prodList.push({
          id: doc.id,
          name: data.name || '',
          stock: typeof data.stock === 'number' ? data.stock : parseInt(data.stock?.toString()) || 0,
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price?.toString()) || 0.0,
          imageUrl: data.imageUrl || '',
        });
      });
      setDbProducts(prodList);
    }, (error) => {
      console.warn("CartContext: Error al traer stock de productos...", error);
    });

    return () => unsubProducts();
  }, []);

  // Referencia de productos en tiempo real para el listener de órdenes (evita re-suscripciones)
  const dbProductsRef = useRef(dbProducts);
  useEffect(() => {
    dbProductsRef.current = dbProducts;
  }, [dbProducts]);

  // Estado para las notificaciones Toasts en pantalla
  const [notifications, setNotifications] = useState([]);

  const addNotification = (title, message, type = 'info', data = {}) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newNotification = { id, title, message, type, data };
    
    setNotifications((prev) => [newNotification, ...prev].slice(0, 4));

    // Descartar automáticamente después de 5 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Escuchar órdenes en tiempo real desde Firestore (Social Proof)
  useEffect(() => {
    let isInitial = true;
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (isInitial) {
        isInitial = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          const customerName = order.customerName || 'Un cliente';
          const itemsList = order.productsPurchased || (order.items || []).map(i => i.name);
          const productsText = itemsList.length > 0 ? itemsList.join(', ') : 'productos';
          const location = order.customerAddress ? order.customerAddress.split(',')[0].trim() : '';

          const text = location 
            ? `desde ${location} acaba de realizar un pedido de: ${productsText} 🛍️`
            : `acaba de realizar un pedido de: ${productsText} 🛍️`;

          // Obtener la imagen del primer producto
          let productImg = '';
          if (order.items && order.items.length > 0) {
            const firstItemId = order.items[0].productId;
            const matchedProd = dbProductsRef.current.find(p => p.id === firstItemId);
            if (matchedProd && matchedProd.imageUrl) {
              productImg = matchedProd.imageUrl;
            }
          }

          addNotification(
            `¡Nueva Compra! 🔥`,
            `${customerName} ${text}`,
            'purchase',
            {
              imageUrl: productImg,
              customerName,
              items: itemsList
            }
          );
        }
      });
    }, (error) => {
      console.warn("CartContext: Error al escuchar órdenes en tiempo real:", error);
    });

    return () => unsubOrders();
  }, []);

  // Persistir el carrito en localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem('ethereal_vapes_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Validar si el carrito propuesto respeta el stock de cada producto individualmente
  const validateProposedCart = (proposedItems) => {
    if (!dbProducts || dbProducts.length === 0) return { valid: true };

    const productRequirements = {};

    proposedItems.forEach((item) => {
      if (item.isCombo) {
        // Un combo consume cada producto según sus productIds
        (item.productIds || []).forEach((pid) => {
          productRequirements[pid] = (productRequirements[pid] || 0) + item.quantity;
        });
      } else {
        // Producto individual
        productRequirements[item.id] = (productRequirements[item.id] || 0) + item.quantity;
      }
    });

    for (const pid in productRequirements) {
      const requiredQty = productRequirements[pid];
      const product = dbProducts.find((p) => p.id === pid);
      if (product) {
        const stockLimit = product.stock !== undefined ? product.stock : 99;
        if (requiredQty > stockLimit) {
          return {
            valid: false,
            productName: product.name,
            stockLimit: stockLimit
          };
        }
      }
    }

    return { valid: true };
  };

  // Añadir ítem al carrito (producto o combo)
  const addToCart = (item, quantityToAdd = 1) => {
    const discountVal = currentUser 
      ? (item.userDiscount !== undefined ? item.userDiscount : (item.discount || 0)) 
      : 0;
    const price = discountVal > 0 
      ? item.price * (1 - discountVal / 100) 
      : (item.specialPrice || item.price);

    const stockLimit = item.stock !== undefined ? item.stock : 99;

    const existingItemIndex = cartItems.findIndex((x) => x.id === item.id);
    let proposedItems = [];

    const newItem = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: price,
      imageUrl: item.imageUrl,
      isCombo: !!item.productIds,
      productIds: item.productIds || [],
      stock: stockLimit,
    };

    if (existingItemIndex > -1) {
      proposedItems = cartItems.map((x, idx) => {
        if (idx === existingItemIndex) {
          return { ...x, quantity: x.quantity + quantityToAdd };
        }
        return x;
      });
    } else {
      proposedItems = [...cartItems, { ...newItem, quantity: quantityToAdd }];
    }

    // Validar carrito propuesto
    const validation = validateProposedCart(proposedItems);
    if (!validation.valid) {
      alert(`Solo tenemos ${validation.stockLimit} unidades disponibles del producto "${validation.productName}". Ajusta la cantidad para continuar.`);
      return;
    }

    setCartItems(proposedItems);

    // Disparar toast de carrito
    addNotification(
      '¡Agregado al Carrito! 🛒',
      `${item.name} (${quantityToAdd} ud.)${quantityToAdd > 1 ? 's' : ''} se agregó a tu pedido.`,
      'cart',
      {
        imageUrl: item.imageUrl,
        isCombo: !!item.productIds,
        productIds: item.productIds || []
      }
    );
  };

  // Remover ítem del carrito
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((x) => x.id !== id));
  };

  // Modificar cantidad directamente en el carrito
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    const proposedItems = cartItems.map((x) => {
      if (x.id === id) {
        return { ...x, quantity: newQuantity };
      }
      return x;
    });

    const validation = validateProposedCart(proposedItems);
    if (!validation.valid) {
      alert(`Solo tenemos ${validation.stockLimit} unidades disponibles del producto "${validation.productName}". Ajusta la cantidad para continuar.`);
      return;
    }

    setCartItems(proposedItems);
  };

  // Limpiar carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Propiedades Calculadas
  const cartTotal = cartItems.reduce((acc, x) => acc + x.price * x.quantity, 0);
  const cartItemCount = cartItems.reduce((acc, x) => acc + x.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}

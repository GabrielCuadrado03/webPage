import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Registro de observador de estado de autenticación y perfil de Firestore
  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Precarga rápida del perfil del usuario con getDoc para desbloquear la UI al instante
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
            setLoading(false);
          }
        } catch (err) {
          console.warn('Error en la precarga rápida del perfil de usuario:', err);
        }

        // Escucha en tiempo real el perfil del usuario en Firestore (igual que ever en Flutter)
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid), 
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
              setLoading(false);
            } else {
              // Auto-crear perfil por defecto de forma resiliente si no existe en Firestore
              const defaultProfile = {
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                phoneNumber: '',
                createdAt: serverTimestamp(),
                isAdmin: false,
                favoriteProductIds: [],
                addresses: []
              };
              setDoc(doc(db, 'users', user.uid), defaultProfile)
                .then(() => {
                  setLoading(false);
                })
                .catch((err) => {
                  console.error('Error al inicializar perfil en Firestore:', err);
                  setUserProfile(null);
                  setLoading(false);
                });
            }
          }, 
          (error) => {
            console.error('Error al escuchar el perfil del usuario:', error);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  // Función de inicio de sesión oficial con Firebase Auth
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Precarga o auto-creación inmediata del perfil antes de resolver el inicio de sesión
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        const defaultProfile = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phoneNumber: '',
          createdAt: serverTimestamp(),
          isAdmin: false,
          favoriteProductIds: [],
          addresses: []
        };
        await setDoc(docRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      console.error("Error al precargar perfil tras login exitoso:", err);
    }

    return userCredential;
  };

  // Función de registro (creación de Auth y escritura en Firestore compatible con Flutter)
  const register = async (email, password, name, phone) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user) {
      // Guardar perfil en la colección 'users'
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        createdAt: serverTimestamp(),
        isAdmin: false,
        favoriteProductIds: [],
        addresses: []
      });
    }
    return credential;
  };

  // Función de cierre de sesión oficial
  const logout = async () => {
    localStorage.removeItem('ethereal_vapes_bypass_admin');
    return signOut(auth);
  };

  // Sincronizar Favoritos en Firestore (100% compatible con Flutter)
  const toggleFavorite = async (productId) => {
    if (!currentUser) throw new Error('Debes iniciar sesión para guardar favoritos.');
    
    const favorites = userProfile?.favoriteProductIds || [];
    const isFav = favorites.includes(productId);
    
    const userRef = doc(db, 'users', currentUser.uid);
    if (isFav) {
      await updateDoc(userRef, {
        favoriteProductIds: arrayRemove(productId)
      });
    } else {
      await updateDoc(userRef, {
        favoriteProductIds: arrayUnion(productId)
      });
    }
  };

  // Agregar dirección de envío en Firestore (100% compatible con Flutter)
  const addUserAddress = async (label, address) => {
    if (!currentUser) throw new Error('Debes iniciar sesión para guardar direcciones.');
    
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      addresses: arrayUnion({ label: label.trim(), address: address.trim() })
    }, { merge: true });
  };

  // Eliminar dirección de envío en Firestore
  const removeUserAddress = async (label, address) => {
    if (!currentUser) throw new Error('Debes iniciar sesión.');
    
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      addresses: arrayRemove({ label, address })
    }, { merge: true });
  };

  // Helper para traducir errores comunes de Firebase Auth en español
  const parseAuthError = (error) => {
    const errorCode = error?.code || error?.message || '';
    const errorString = errorCode.toLowerCase();
    
    if (errorString.includes('email-already-in-use') || errorString.includes('email_exists')) {
      return 'Este correo electrónico ya está registrado. Intenta iniciar sesión o usa otro.';
    } else if (errorString.includes('weak-password')) {
      return 'La contraseña elegida es muy débil. Debe tener al menos 6 caracteres.';
    } else if (errorString.includes('invalid-email') || errorString.includes('invalid_email')) {
      return 'El formato del correo electrónico ingresado no es válido.';
    } else if (errorString.includes('user-not-found') || 
               errorString.includes('wrong-password') || 
               errorString.includes('invalid-credential') ||
               errorString.includes('invalid_login_credentials')) {
      return 'El correo o la contraseña son incorrectos. Por favor verifica.';
    } else if (errorString.includes('network-request-failed')) {
      return 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
    } else if (errorString.includes('too-many-requests')) {
      return 'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.';
    } else if (errorString.includes('user-disabled')) {
      return 'Esta cuenta de usuario ha sido inhabilitada.';
    }
    
    return error?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  };

  // Restablecer contraseña mediante correo electrónico de Firebase
  const sendPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    toggleFavorite,
    addUserAddress,
    removeUserAddress,
    parseAuthError,
    sendPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

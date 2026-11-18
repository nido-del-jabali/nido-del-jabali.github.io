// =====================================================================
//  CONFIGURACIÓN
// =====================================================================
//  Correo con acceso de administrador.
export const ADMIN_EMAIL = "nidodeljavalismokehouse@gmail.com";

//  Firebase (gratuito) guarda los pedidos, precios, promociones y reseñas
//  en la nube, para que el administrador vea los pedidos que hacen los
//  clientes desde cualquier teléfono o computadora.
//
//  Mientras esto quede vacío, la página funciona en "modo demostración":
//  todo se guarda solo en el navegador donde se abre (útil para probar,
//  pero los pedidos de otros dispositivos NO llegan al administrador).
//
//  Ver README.md → "Activar pedidos en línea (Firebase)".
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBjA1I5K9FYCJx9xPdUVekupJ5BdK6l93o",
  authDomain: "nido-del-jabali.firebaseapp.com",
  projectId: "nido-del-jabali",
  storageBucket: "nido-del-jabali.firebasestorage.app",
  messagingSenderId: "357173119277",
  appId: "1:357173119277:web:533ca7fef1f1732a526ba4",
};

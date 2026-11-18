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
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

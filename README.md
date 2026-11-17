# Nido del Jabalí Smokehouse — Página web

Página del restaurante: promociones, menú con pedidos en línea, galería, reseñas,
contacto (272 281 38 77) y panel de administrador (menú de 3 líneas → **Administrador**).

## Estructura

```
index.html          Página
css/styles.css      Estilos
js/app.js           Lógica (carrito, pedidos, reseñas, panel admin)
js/store.js         Guardado de datos (Firebase o navegador)
js/defaults.js      Menú, promociones y reseñas iniciales
js/config.js        Correo admin y configuración de Firebase
firestore.rules     Reglas de seguridad de la base de datos
img/                Logo y fotos
```

## Probar en tu computadora

```bash
cd nido-del-jabali
python3 -m http.server 8080
```

Abre http://localhost:8080

## Modo demostración vs. pedidos en línea

Sin configurar Firebase, la página funciona en **modo demostración**: los pedidos,
precios y reseñas se guardan solo en el navegador donde se abre. Sirve para probar,
pero **los pedidos que hagan los clientes desde su teléfono no le llegarán al
administrador**. Para eso hay que conectar Firebase (gratis):

### Activar pedidos en línea (Firebase)

1. Entra a https://console.firebase.google.com con la cuenta del restaurante y crea un proyecto.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. En **Authentication → Users → Add user** crea el usuario
   `nidodeljvalismokehouse@gmail.com` con su contraseña.
4. **Build → Firestore Database → Create database** (modo producción).
5. En **Firestore → Rules** pega el contenido de `firestore.rules` y publica.
6. En **Project settings → General → Your apps → Web (</>)** registra la app y copia
   el objeto `firebaseConfig` dentro de `FIREBASE_CONFIG` en `js/config.js`.
7. En **Authentication → Settings → Authorized domains** agrega el dominio donde
   publiques la página (por ejemplo `TU-USUARIO.github.io`).

La contraseña del administrador vive solo en Firebase, no en el código.

## Publicar con GitHub Pages

1. Sube este repositorio a GitHub.
2. En el repositorio: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
3. La página quedará en `https://TU-USUARIO.github.io/nido-del-jabali/`.

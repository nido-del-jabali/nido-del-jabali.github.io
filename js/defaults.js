// Contenido inicial. El administrador puede cambiarlo desde el panel.

export const CATEGORIES = [
  { id: "costilla", name: "Costilla BBQ" },
  { id: "alitas", name: "Alitas Texanas", note: "Sabores: BBQ · Tamarindo Chipotle · Mango Habanero · Búfalo" },
  { id: "tabla", name: "Tabla Nido del Jabalí" },
  { id: "bebidas", name: "Bebidas" },
  { id: "guarniciones", name: "Guarniciones" },
];

export const FLAVORS = ["BBQ", "Tamarindo Chipotle", "Mango Habanero", "Búfalo"];
export const SIDES = ["½ puré de papa", "½ pasta espiral"];

// options: "flavor" = elegir sabor de alitas, "side" = elegir 1 guarnición
export const DEFAULT_MENU = [
  { id: "rack-1kg", cat: "costilla", name: "Rack de costilla BBQ 1 kg", desc: "Acompañado con 2 guarniciones: ½ puré de papa y ½ pasta espiral", price: 430, options: [] },
  { id: "rack-medio", cat: "costilla", name: "Medio (½ kg) rack de costilla BBQ", desc: "Acompañada con ½ puré de papa o ½ pasta espiral", price: 230, options: ["side"] },
  { id: "alitas-22", cat: "alitas", name: "Orden de 22 alitas", desc: "Acompañadas con 2 guarniciones: ½ puré de papa y ½ pasta espiral", price: 230, options: ["flavor"] },
  { id: "alitas-11", cat: "alitas", name: "Media orden 11 alitas", desc: "Con 1 sola guarnición", price: 130, options: ["flavor", "side"] },
  { id: "tabla", cat: "tabla", name: "Tabla Nido del Jabalí", desc: "½ kg de costilla BBQ + ½ orden de alitas texanas (11) + 2 guarniciones", price: 350, options: ["flavor"] },
  { id: "limonada-fresa", cat: "bebidas", name: "Limonada fresa", desc: "", price: 35, options: [] },
  { id: "naranjada", cat: "bebidas", name: "Naranjada de limón", desc: "", price: 35, options: [] },
  { id: "jarra-limonada", cat: "bebidas", name: "Jarra de limonada", desc: "", price: 60, options: [] },
  { id: "refresco", cat: "bebidas", name: "Refrescos", desc: "", price: 30, options: [] },
  { id: "pure", cat: "guarniciones", name: "½ puré de papa", desc: "", price: 30, options: [] },
  { id: "pasta", cat: "guarniciones", name: "½ pasta espiral", desc: "", price: 30, options: [] },
];

export const DEFAULT_PROMOS = [
  { id: "promo-tabla", tag: "Para compartir", title: "Tabla + Jarra", desc: "Tabla Nido del Jabalí con una jarra de limonada bien fría.", price: 390, before: 410, active: true },
  { id: "promo-martes", tag: "Martes de alitas", title: "22 alitas + 2 refrescos", desc: "Todos los martes: orden de 22 alitas en el sabor que quieras con 2 refrescos.", price: 260, before: 290, active: true },
  { id: "promo-familiar", tag: "Combo familiar", title: "El Corral Completo", desc: "Rack de costilla de 1 kg + orden de 22 alitas + jarra de limonada. Ideal para 4 personas.", price: 690, before: 720, active: true },
];

const day = 86400000;
const now = Date.now();
export const SEED_REVIEWS = [
  { name: "Mariana G.", rating: 5, text: "Las costillas se deshacen solitas del hueso. La salsa de Tamarindo Chipotle es otra cosa, ¡ya pedí el rack de 1 kg dos veces esta semana!", createdAt: now - 3 * day },
  { name: "Carlos R.", rating: 5, text: "Las alitas Mango Habanero tienen el picor perfecto. Llegaron calientitas y la porción de 22 alcanza muy bien. Súper recomendado.", createdAt: now - 6 * day },
  { name: "Fernanda L.", rating: 5, text: "Pedimos la Tabla Nido del Jabalí para ver el partido y fue un éxito. El puré de papa casero está buenísimo.", createdAt: now - 9 * day },
  { name: "Jorge M.", rating: 5, text: "Las mejores costillas BBQ de la zona, ese ahumado se nota. La limonada de fresa es el complemento ideal.", createdAt: now - 14 * day },
  { name: "Ale T.", rating: 4, text: "Las alitas Búfalo bien crujientes y con buen sabor. Atención muy amable por teléfono. Volveré por las costillas.", createdAt: now - 20 * day },
  { name: "Rodrigo P.", rating: 5, text: "Precio justo por la cantidad de carne. La pasta espiral cremosa con las costillas es una combinación que no falla.", createdAt: now - 27 * day },
];

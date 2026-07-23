export const menuNote = { label: 'Menu Frites + Boisson', price: '+3,50€' }

export const burgers = [
  {
    label: 'Le classique',
    name: 'Kefta ou Poulet',
    desc: 'Crudités · Fromage',
    price: '8,00€',
    img: '/images/burger1.png',
  },
  {
    label: 'Le signature',
    name: 'Poulet Mariné',
    desc: 'Crudités · Fromage',
    price: '8,50€',
    img: '/images/burger2.png',
  },
  {
    label: "L'incontournable",
    name: 'Crunchy',
    desc: 'Tenders · Jambon de poulet fumé · Crudités · Fromage Edam',
    price: '7,00€',
    img: '/images/burger3.png',
    featured: true,
  },
]

export const texmex = [
  { name: 'Tenders x3', price: '4,00€', img: '/images/tenders.png' },
  { name: 'Nuggets x5', price: '4,00€' },
  { name: 'Sticks Mozza', price: '4,00€' },
  { name: 'Bouchées Camembert', price: '4,00€', img: '/images/camambert.png' },
  { name: 'Wings x8', price: '5,00€', img: '/images/wings.png' },
  { name: 'Jalapeños x4', price: '1,00€' },
]

export const sandwichs = [
  { name: 'Kefta Fromage', price: '6,00€', img: '/images/kefta-fromage.png' },
  { name: 'Dinde Fromage', price: '6,00€' },
  { name: 'Dinde Frites', price: '6,00€' },
  { name: 'Poulet Mariné Fromage', price: '6,50€', img: '/images/poulet-marine-fromage.png' },
  { name: 'Poulet Mariné Frites', price: '6,50€' },
]

export const menuKids = {
  name: 'Menu Kids',
  desc: 'Mini Tacos ou Cheese Burger + Frites + Tropico + Activia',
  price: '6,50€',
}

export const tacosTailles = [
  { size: 'M', viandes: '1 Viande', price: '7,00€' },
  { size: 'L', viandes: '2 Viandes', price: '9,00€' },
  { size: 'XL', viandes: '3 Viandes', price: '11,00€' },
]

export const tacosViandes = [
  'Kefta',
  'Poulet',
  'Poulet Mariné',
  'Cordon Bleu',
  'Tenders',
  'Nuggets',
]

export const sauces = {
  classiques: ['Andalouse', 'Barbecue', 'Biggy', 'Blanche', 'Curry', 'Ketchup', 'Mayonnaise', 'Moutarde'],
  piquantes: ['Algérienne', 'Chili Thaï', 'Harissa', 'Samouraï'],
}

export const extras = {
  surcharge: '+1,00€',
  items: ['Cheddar', 'Emmental Râpé', 'Chèvre', 'Raclette', 'Oignons Frits', 'Jambon de poulet fumé'],
}

export const supplements = [
  { name: 'Frites', price: '+1€' },
  { name: 'Fromage (Edam, Raclette ou Cheddar)', price: '+1€' },
  { name: 'Oeuf', price: '+1€' },
  { name: 'Jambon de poulet fumé', price: '+1€' },
  { name: 'Viande', price: '+2€' },
]

export const frites = [
  { name: 'Moyenne', price: '3,50€' },
  { name: 'Grande', price: '4,50€' },
]

export const desserts = [{ name: 'Tiramisu', price: '3,00€' }]

export const boissons = [
  { name: '33cl', price: '1,50€' },
  { name: '50cl', price: '2,00€' },
]

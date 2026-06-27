export const sandwichsData = {
  classiques: [
    { name: 'Kefta Fromage', price: 6.00 },
    { name: 'Kefta Frites', price: 6.00 },
    { name: 'Poulet Fromage', price: 6.00 },
    { name: 'Poulet Frites', price: 6.00 },
    { name: 'Poulet Mariné Fromage', price: 6.50 },
    { name: 'Poulet Mariné Frites', price: 6.50 },
  ],
  supplements: {
    plus1: ['Frites', 'Fromage (Edam, Raclette ou Cheddar)', 'Oeuf', 'Jambon de poulet fumé'],
    plus2: ['Viande'],
  },
  crunchy: {
    label: "L'Incontournable",
    name: 'Crunchy',
    desc: 'Tenders · Jambon de poulet fumé · Crudités · Fromage Edam',
    price: 7.00,
  },
  menu: 'Menu Frites + Boisson · +3.50€',
}

export const heroImages = {
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=500&q=85',
  sandwich: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&h=500&q=85',
}

export const burgersData = {
  megaCheese: [
    { desc: 'Kefta ou Poulet · Crudités · Fromage', price: 8.00 },
    { desc: 'Poulet Mariné · Crudités · Fromage', price: 8.50 },
  ],
  crunchy: {
    label: "L'Incontournable",
    name: 'Crunchy',
    desc: 'Tenders · Jambon de poulet fumé · Crudités · Fromage Edam',
    price: 7.00,
  },
  supplements: {
    plus1: ['Frites', 'Fromage (Edam, Raclette ou Cheddar)', 'Oeuf', 'Jambon de poulet fumé'],
    plus2: ['Viande'],
  },
  texmex: [
    { name: 'Tenders x3', price: 4.00 },
    { name: 'Nuggets x5', price: 4.00 },
    { name: 'Sticks Mozza', price: 4.00 },
    { name: 'Chics x4', price: 4.00 },
    { name: 'Wings x8', price: 5.00 },
    { name: 'Jalapeños x4', price: 1.00 },
  ],
  menuKids: {
    desc: 'Mini Tacos ou Cheese Burger + Frites + Tropico + Activia',
    price: 6.50,
  },
  frites: [
    { name: 'Moyenne', price: 3.50 },
    { name: 'Grande', price: 4.50 },
  ],
  desserts: [
    { name: 'Tiramisu', price: 3.00 },
  ],
  boissons: [
    { name: '33cl', price: 1.50 },
    { name: '50cl', price: 2.00 },
  ],
  menu: 'Menu Frites + Boisson · +3.50€',
}

export const tacosData = {
  tailles: [
    { size: 'M', viandes: '1 Viande', price: 7.00 },
    { size: 'L', viandes: '2 Viandes', price: 9.00 },
    { size: 'XL', viandes: '3 Viandes', price: 11.00 },
  ],
  viandes: [
    { name: 'Kefta',         img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=160&h=160&q=80' },
    { name: 'Poulet',        img: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=160&h=160&q=80' },
    { name: 'Poulet Mariné', img: 'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?auto=format&fit=crop&w=160&h=160&q=80' },
    { name: 'Cordon Bleu',   img: 'https://images.unsplash.com/photo-1619019187211-adf2f6119afd?auto=format&fit=crop&w=160&h=160&q=80' },
    { name: 'Tenders',       img: 'https://images.unsplash.com/photo-1605291581926-df4bf7ee3e89?auto=format&fit=crop&w=160&h=160&q=80' },
    { name: 'Nuggets',       img: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=160&h=160&q=80' },
  ],
  sauces: {
    classiques: ['Andalouse', 'Barbecue', 'Biggy', 'Blanche', 'Curry', 'Ketchup', 'Mayonnaise', 'Moutarde'],
    piquantes: ['Algérienne', 'Chili Thaï', 'Harissa', 'Samouraï'],
  },
  extras: {
    surcharge: '+1.00€',
    items: ['Cheddar', 'Emmental Râpé', 'Chèvre', 'Raclette', 'Oignons Frits', 'Jambon de poulet fumé'],
  },
  note: 'Tous nos tacos sont garnis de sauce Fromagère Maison',
  menu: 'Menu Frites + Boisson · +3.50€',
}

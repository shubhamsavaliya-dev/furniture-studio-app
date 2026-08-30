import db from './db.js';

const products = [
  {
    name: 'Modern Nordic Sofa',
    category: 'Sofas',
    material: 'Fabric, Wood',
    dimensions: '200x90x85 cm',
    price_inr: 45000,
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    in_stock: 12,
    description: 'A beautiful modern sofa perfect for any contemporary living room.'
  },
  {
    name: 'Classic Leather Armchair',
    category: 'Chairs',
    material: 'Genuine Leather, Metal',
    dimensions: '85x85x95 cm',
    price_inr: 25000,
    image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    in_stock: 8,
    description: 'Comfortable and durable leather armchair.'
  },
  {
    name: 'Solid Oak Dining Table',
    category: 'Dining Tables',
    material: 'Oak Wood',
    dimensions: '180x90x75 cm',
    price_inr: 55000,
    image_url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80',
    in_stock: 5,
    description: 'Sturdy solid oak dining table that seats up to 6 people comfortably.'
  },
  {
    name: 'Minimalist Bed Frame',
    category: 'Beds',
    material: 'Pine Wood',
    dimensions: '200x160x100 cm',
    price_inr: 35000,
    image_url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80',
    in_stock: 10,
    description: 'Clean lines and a sturdy minimalist frame for a restful night.'
  },
  {
    name: 'Industrial Office Desk',
    category: 'Desks',
    material: 'Metal, Engineered Wood',
    dimensions: '140x70x75 cm',
    price_inr: 18000,
    image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    in_stock: 15,
    description: 'Perfect for working from home with ample space and industrial style.'
  },
  {
    name: 'Velvet Lounge Chair',
    category: 'Chairs',
    material: 'Velvet, Brass',
    dimensions: '80x75x85 cm',
    price_inr: 22000,
    image_url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
    in_stock: 20,
    description: 'Luxurious velvet chair with brass legs.'
  },
  {
    name: 'Mid-Century Dining Chair',
    category: 'Chairs',
    material: 'Walnut, Fabric',
    dimensions: '50x55x80 cm',
    price_inr: 8500,
    image_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
    in_stock: 40,
    description: 'Iconic mid-century design dining chair.'
  },
  {
    name: 'King Size Storage Bed',
    category: 'Beds',
    material: 'Engineered Wood',
    dimensions: '210x190x110 cm',
    price_inr: 65000,
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    in_stock: 4,
    description: 'Spacious king-size bed with built-in storage drawers.'
  }
];

const seedDB = () => {
  const check = db.prepare('SELECT COUNT(*) as count FROM products').get();
  
  if (check.count === 0) {
    console.log('Seeding products table...');
    const insert = db.prepare(`
      INSERT INTO products (name, category, material, dimensions, price_inr, image_url, in_stock, description)
      VALUES (@name, @category, @material, @dimensions, @price_inr, @image_url, @in_stock, @description)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    
    insertMany(products);
    console.log('Database seeded successfully!');
  } else {
    console.log('Database already contains products. Skipping seed.');
  }
};

seedDB();

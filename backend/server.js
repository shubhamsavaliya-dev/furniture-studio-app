import express from 'express';
import cors from 'cors';
import db from './db.js';
import './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Authentication ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'showroom123';
const ADMIN_TOKEN = 'admin-secret-token-2026';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === ADMIN_TOKEN) {
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// --- Products Endpoints ---

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a new product
app.post('/api/products', authenticateAdmin, (req, res) => {
  try {
    const { name, category, material, dimensions, price_inr, image_url, in_stock, description } = req.body;
    const stmt = db.prepare(`
      INSERT INTO products (name, category, material, dimensions, price_inr, image_url, in_stock, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, category, material, dimensions, price_inr, image_url, in_stock, description);
    res.status(201).json({ id: info.lastInsertRowid, ...req.body });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a product
app.put('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, material, dimensions, price_inr, image_url, in_stock, description } = req.body;
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, material = ?, dimensions = ?, price_inr = ?, image_url = ?, in_stock = ?, description = ?
      WHERE id = ?
    `);
    const info = stmt.run(name, category, material, dimensions, price_inr, image_url, in_stock, description, id);
    if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ id, ...req.body });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a product
app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Orders Endpoints ---

// Create an order
app.post('/api/orders', (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, total_amount, items } = req.body;
    
    let orderId;
    const placeOrder = db.transaction(() => {
      // Create the order
      const orderStmt = db.prepare(`
        INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount)
        VALUES (?, ?, ?, ?)
      `);
      const orderInfo = orderStmt.run(customer_name, customer_phone, customer_address, total_amount);
      orderId = orderInfo.lastInsertRowid;
      
      // Create order items and update stock
      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
        VALUES (?, ?, ?, ?)
      `);
      const updateStockStmt = db.prepare(`
        UPDATE products SET in_stock = in_stock - ? WHERE id = ?
      `);

      for (const item of items) {
        itemStmt.run(orderId, item.product_id, item.quantity, item.price_at_order);
        updateStockStmt.run(item.quantity, item.product_id);
      }
    });

    placeOrder();
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all orders
app.get('/api/orders', authenticateAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    
    // Fetch items for each order
    const itemStmt = db.prepare(`
      SELECT oi.*, p.name, p.image_url 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);
    
    const ordersWithItems = orders.map(order => {
      const items = itemStmt.all(order.id);
      return { ...order, items };
    });
    
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update order status
app.put('/api/orders/:id/status', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const stmt = db.prepare('UPDATE orders SET order_status = ? WHERE id = ?');
    const info = stmt.run(status, id);
    if (info.changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Custom Inquiries Endpoints ---

// Create custom inquiry
app.post('/api/custom-inquiries', (req, res) => {
  try {
    const { customer_name, customer_phone, template, material, dimensions, special_features, notes, image_url, estimated_price } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO custom_inquiries (customer_name, customer_phone, template, material, dimensions, special_features, notes, image_url, estimated_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(customer_name, customer_phone, template, material, dimensions, special_features, notes, image_url, estimated_price);
    res.status(201).json({ message: 'Custom inquiry submitted', id: info.lastInsertRowid });
  } catch (error) {
    console.error('Error creating custom inquiry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all custom inquiries
app.get('/api/custom-inquiries', authenticateAdmin, (req, res) => {
  try {
    const inquiries = db.prepare('SELECT * FROM custom_inquiries ORDER BY created_at DESC').all();
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching custom inquiries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update custom inquiry (price/status)
app.put('/api/custom-inquiries/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { final_price, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE custom_inquiries 
      SET final_price = ?, status = ?
      WHERE id = ?
    `);
    
    const info = stmt.run(final_price, status, id);
    if (info.changes === 0) return res.status(404).json({ error: 'Inquiry not found' });
    res.json({ message: 'Custom inquiry updated successfully' });
  } catch (error) {
    console.error('Error updating custom inquiry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Proxy Endpoint ---

// Proxy image to bypass CORS for PDF generation
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).json({ error: 'Missing url parameter' });
    
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

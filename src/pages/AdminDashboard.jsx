import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Package, ListOrdered, Plus, Edit2, Trash2, Loader2, Save, X, Sparkles, Download, MessageCircle, LogOut, Lock, QrCode } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const pdfRefs = useRef({});
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('adminAuth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', category: '', material: '', dimensions: '', 
    price_inr: '', image_url: '', in_stock: '', description: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await api.get('/products');
        setProducts(res.data);
      } else if (activeTab === 'orders') {
        const res = await api.get('/orders');
        setOrders(res.data);
      } else if (activeTab === 'inquiries') {
        const res = await api.get('/custom-inquiries');
        setInquiries(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { username, password });
      if (res.data.success) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminToken', res.data.token);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setLoginError('Invalid username or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  // --- Inventory Handlers ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price_inr: parseInt(productForm.price_inr),
        in_stock: parseInt(productForm.in_stock)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      material: product.material,
      dimensions: product.dimensions,
      price_inr: product.price_inr,
      image_url: product.image_url,
      in_stock: product.in_stock,
      description: product.description
    });
    setShowProductForm(true);
  };

  const resetForm = () => {
    setProductForm({
      name: '', category: '', material: '', dimensions: '', 
      price_inr: '', image_url: '', in_stock: '', description: ''
    });
    setEditingProduct(null);
  };

  // --- Orders Handlers ---
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed': 
      case 'Quoted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- Inquiries Handlers ---
  const updateInquiry = async (id, field, value) => {
    try {
      const inquiry = inquiries.find(i => i.id === id);
      const payload = {
        final_price: field === 'final_price' ? value : inquiry.final_price,
        status: field === 'status' ? value : inquiry.status
      };
      await api.put(`/custom-inquiries/${id}`, payload);
      fetchData();
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const generatePDF = async (id, type) => {
    let orderData = null;
    let inquiryData = null;
    let imageUrl = null;
    let customerName = '';
    let customerPhone = '';
    
    if (type === 'order') {
      orderData = orders.find(o => o.id === id);
      if (!orderData) return;
      customerName = orderData.customer_name;
      customerPhone = orderData.customer_phone;
    } else {
      inquiryData = inquiries.find(i => i.id === id);
      if (!inquiryData) return;
      customerName = inquiryData.customer_name;
      customerPhone = inquiryData.customer_phone;
      imageUrl = inquiryData.image_url;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(22);
    pdf.setTextColor(63, 81, 181);
    pdf.text('FURNITURE STUDIO SHOWROOM', 15, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(type === 'order' ? `Order Receipt #${id}` : `Official Custom Quotation #${id}`, 15, 28);
    
    // Customer Details
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(customerName || 'Customer', 195, 20, { align: 'right' });
    pdf.setTextColor(100, 100, 100);
    pdf.text(customerPhone || '', 195, 26, { align: 'right' });
    pdf.setFontSize(10);
    const dateStr = type === 'order' ? new Date(orderData.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    pdf.text(`Date: ${dateStr}`, 195, 32, { align: 'right' });
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, 38, 195, 38);

    let yPos = 45;

    // Image for inquiry
    if (imageUrl) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
        if (!response.ok) throw new Error('Proxy fetch failed');
        const blob = await response.blob();
        const base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        pdf.addImage(base64data, 'JPEG', 15, yPos, 90, 67.5);
      } catch (err) {
        console.warn('Failed to embed image in PDF via proxy, proceeding with text only:', err);
        pdf.setFontSize(10);
        pdf.text('[Image unavailable - Network/CORS Error]', 15, yPos + 5);
      }
    }

    // Specifications / Items
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    if (type === 'order') {
      pdf.text('Order Items', 15, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Item', 15, yPos);
      pdf.text('Qty', 140, yPos);
      pdf.text('Price', 195, yPos, { align: 'right' });
      yPos += 3;
      pdf.line(15, yPos, 195, yPos);
      yPos += 7;
      
      pdf.setTextColor(0, 0, 0);
      orderData.items?.forEach(item => {
        pdf.text(item.name, 15, yPos);
        pdf.text(item.quantity.toString(), 140, yPos);
        pdf.text(`Rs. ${(item.price_at_order * item.quantity).toLocaleString()}`, 195, yPos, { align: 'right' });
        yPos += 8;
      });
      
    } else {
      const textX = 115;
      pdf.text('Specifications', textX, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Item:', textX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(inquiryData.template, textX + 30, yPos);
      
      yPos += 8;
      pdf.setTextColor(100, 100, 100);
      pdf.text('Material:', textX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(inquiryData.material, textX + 30, yPos);
      
      yPos += 8;
      pdf.setTextColor(100, 100, 100);
      pdf.text('Dimensions:', textX, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(inquiryData.dimensions, textX + 30, yPos);
      
      yPos += 8;
      pdf.setTextColor(100, 100, 100);
      pdf.text('Features:', textX, yPos);
      pdf.setTextColor(0, 0, 0);
      const splitFeatures = pdf.splitTextToSize(inquiryData.special_features || 'None', 50);
      pdf.text(splitFeatures, textX + 30, yPos);
      
      yPos += (splitFeatures.length * 5) + 3;
      if (inquiryData.notes) {
        pdf.setTextColor(100, 100, 100);
        pdf.text('Notes:', textX, yPos);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'italic');
        const splitNotes = pdf.splitTextToSize(`"${inquiryData.notes}"`, 50);
        pdf.text(splitNotes, textX + 30, yPos);
        pdf.setFont(undefined, 'normal');
        yPos += (splitNotes.length * 5);
      }
    }
    
    // Price Block
    yPos = Math.max(yPos + 10, 120);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(15, yPos, 180, 20, 'F');
    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    
    if (type === 'order') {
      pdf.text('Total Paid:', 25, yPos + 13);
      pdf.setFontSize(18);
      pdf.setTextColor(63, 81, 181);
      pdf.text(`Rs. ${orderData.total_amount.toLocaleString('en-IN')}`, 185, yPos + 14, { align: 'right' });
    } else {
      pdf.text('Final Workshop Price:', 25, yPos + 13);
      pdf.setFontSize(18);
      pdf.setTextColor(63, 81, 181);
      pdf.text(`Rs. ${(inquiryData.final_price || inquiryData.estimated_price).toLocaleString('en-IN')}`, 185, yPos + 14, { align: 'right' });
    }
    
    // Terms
    yPos += 35;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, yPos, 195, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'bold');
    pdf.text('Terms & Conditions:', 15, yPos);
    pdf.setFont(undefined, 'normal');
    if (type === 'order') {
      pdf.text('1. Thank you for your order.', 15, yPos + 6);
      pdf.text('2. Please retain this receipt for your records.', 15, yPos + 12);
    } else {
      pdf.text('1. This quotation is valid for 30 days from the date of issue.', 15, yPos + 6);
      pdf.text('2. A 50% advance payment is required to commence production.', 15, yPos + 12);
      pdf.text('3. Colors and textures in the generated image are indicative and may slightly vary.', 15, yPos + 18);
    }
    
    pdf.save(`Quotation_${type}_${id}.pdf`);
  };

  const shareWhatsAppOrder = (order) => {
    const itemsList = order.items.map(i => `${i.quantity}x ${i.name}`).join('%0A');
    const text = `*Order Receipt - #${order.id}*%0A%0A*Customer:* ${order.customer_name}%0A*Phone:* ${order.customer_phone}%0A*Address:* ${order.customer_address}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ₹${order.total_amount.toLocaleString()}%0A*Status:* ${order.order_status}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareWhatsAppInquiry = (inq) => {
    const message = `*FURNITURE STUDIO SHOWROOM - QUOTATION* 🛋️
   
*Customer:* ${inq.customer_name || 'Valued Customer'}
*Phone:* ${inq.customer_phone || 'N/A'}

*Item:* ${inq.template || 'Custom Furniture'}
*Material:* ${inq.material || 'Standard Wood'}
*Dimensions:* ${inq.dimensions}
*Features:* ${inq.special_features || 'Standard Build'}

*Estimated Price:* ₹${(inq.final_price || inq.estimated_price)?.toLocaleString('en-IN') || '0'}

*Design Link:* ${inq.image_url || 'N/A'}

Thank you for choosing Furniture Studio Showroom!`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
          <p className="text-gray-500 mt-2">Enter your credentials to access the showroom dashboard.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{loginError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" disabled={isLoggingIn} className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium flex justify-center items-center">
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Showroom Admin</h1>
          <div className="flex items-center gap-3">
            <Link to="/standee" target="_blank" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100">
              <QrCode className="w-4 h-4" />
              Print QR Standee
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'inventory' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Manage Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Incoming Orders
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'inquiries' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Custom AI Inquiries
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Inventory View */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Current Stock</h2>
                {!showProductForm && (
                  <button 
                    onClick={() => { resetForm(); setShowProductForm(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                )}
              </div>

              {/* Product Form */}
              {showProductForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                    <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Product Name" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                    <input type="text" placeholder="Category (e.g. Sofas)" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                    <input type="text" placeholder="Material" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.material} onChange={e => setProductForm({...productForm, material: e.target.value})} />
                    <input type="text" placeholder="Dimensions (e.g. 200x90x85 cm)" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.dimensions} onChange={e => setProductForm({...productForm, dimensions: e.target.value})} />
                    <input type="number" placeholder="Price (INR)" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.price_inr} onChange={e => setProductForm({...productForm, price_inr: e.target.value})} />
                    <input type="number" placeholder="Stock Quantity" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={productForm.in_stock} onChange={e => setProductForm({...productForm, in_stock: e.target.value})} />
                    <input type="url" placeholder="Image URL (Unsplash)" className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2" value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
                    <textarea placeholder="Description" rows="3" required className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2 resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                    
                    <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                      <button type="button" onClick={() => setShowProductForm(false)} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 font-medium">
                        <Save className="w-4 h-4" /> {editingProduct ? 'Update' : 'Save'} Product
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Inventory Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-xs border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                               <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{product.name}</p>
                              <p className="text-gray-500 text-xs">{product.category}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">₹{product.price_inr.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${product.in_stock > 5 ? 'bg-green-100 text-green-800' : product.in_stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {product.in_stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => startEditProduct(product)} className="text-blue-600 hover:text-blue-800 p-2 mr-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {products.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No products found. Add some to get started.</div>
                )}
              </div>
            </div>
          )}

          {/* Orders View */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <ListOrdered className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                  <p className="text-gray-500 mt-1">When customers place inquiries, they will appear here.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-gray-900 text-lg">Order #{order.id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.order_status)}`}>
                            {order.order_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Order Details */}
                    <div className="p-6 flex flex-col md:flex-row gap-8">
                      {/* Customer Info */}
                      <div className="md:w-1/3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Details</h4>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-indigo-600 font-medium my-1">{order.customer_phone}</p>
                        <p className="text-gray-600 text-sm mt-2">{order.customer_address}</p>
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => shareWhatsAppOrder(order)} className="p-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1ebe5d] transition-colors" title="Share via WhatsApp">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => generatePDF(order.id, 'order')} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Download PDF">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Items */}
                      <div className="md:w-2/3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img src={item.image_url || '/placeholder-furniture.jpg'} alt={item.name} className="w-12 h-12 object-cover rounded-md border border-neutral-200 bg-neutral-100 flex-shrink-0" />
                                <span className="bg-white border border-gray-200 w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-gray-600">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-gray-900">{item.name}</span>
                              </div>
                              <span className="text-gray-600">₹{(item.price_at_order * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-gray-900">Total Amount</span>
                          <span className="text-xl font-black text-gray-900">₹{order.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Removed PDF Invisible Template for Order as we use pure jsPDF */}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Custom Inquiries View */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              {inquiries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Custom Inquiries</h3>
                  <p className="text-gray-500 mt-1">AI Studio requests will appear here.</p>
                </div>
              ) : (
                inquiries.map(inq => (
                  <div key={inq.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-gray-900 text-lg">Inquiry #{inq.id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(inq.status)}`}>
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(inq.created_at).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <select
                          value={inq.status}
                          onChange={(e) => updateInquiry(inq.id, 'status', e.target.value)}
                          className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Quoted">Quoted</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row gap-8">
                      {/* Image */}
                      <div className="md:w-1/4">
                        <img 
                          src={inq.image_url ? `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(inq.image_url)}` : ''} 
                          alt="Custom AI Design" 
                          className="w-32 h-24 object-cover rounded-lg border border-neutral-200 bg-neutral-100 flex-shrink-0"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div className="md:w-1/2 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                          <p className="font-medium text-gray-900">{inq.customer_name} • <span className="text-indigo-600">{inq.customer_phone}</span></p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="text-gray-500 block mb-1">Item</span><span className="font-medium">{inq.template}</span></div>
                          <div><span className="text-gray-500 block mb-1">Material</span><span className="font-medium">{inq.material}</span></div>
                          <div><span className="text-gray-500 block mb-1">Dimensions</span><span className="font-medium">{inq.dimensions}</span></div>
                          <div><span className="text-gray-500 block mb-1">Special Features</span><span className="font-medium">{inq.special_features || 'None'}</span></div>
                        </div>
                        {inq.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg text-sm italic text-gray-600">
                            "{inq.notes}"
                          </div>
                        )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="md:w-1/4 flex flex-col justify-between">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                           <p className="text-xs font-bold text-gray-500 mb-1">Estimated Price</p>
                           <p className="text-lg font-bold text-gray-900 mb-4">₹{inq.estimated_price.toLocaleString()}</p>
                           
                           <label className="text-xs font-bold text-gray-500 mb-1 block">Final Workshop Price</label>
                           <input 
                              type="number"
                              defaultValue={inq.final_price || ''}
                              onBlur={(e) => updateInquiry(inq.id, 'final_price', Number(e.target.value))}
                              placeholder="Enter final quote"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                           />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => shareWhatsAppInquiry(inq)} className="flex-1 flex justify-center items-center gap-2 p-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1ebe5d] transition-colors text-sm font-bold">
                            <MessageCircle className="w-4 h-4" /> Share
                          </button>
                          <button onClick={() => generatePDF(inq.id, 'inquiry')} className="flex-1 flex justify-center items-center gap-2 p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold">
                            <Download className="w-4 h-4" /> PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Removed PDF Invisible Template for Inquiry as we use pure jsPDF */}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

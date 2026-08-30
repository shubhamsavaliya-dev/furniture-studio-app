import { useState } from 'react';
import { X, Trash2, ArrowRight, Package } from 'lucide-react';
import axios from 'axios';

const CartDrawer = ({ isOpen, onClose, cart, setCart }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.price_inr * item.quantity, 0);

  const handleRemove = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.in_stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const orderPayload = {
        ...formData,
        total_amount: totalAmount,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price_at_order: item.price_inr
        }))
      };
      
      await axios.post('http://localhost:3001/api/orders', orderPayload);
      setOrderSuccess(true);
    } catch (error) {
      console.error('Failed to submit order', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full bg-white shadow-2xl flex flex-col transform transition-transform">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Your Inquiry Cart
            </h2>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {orderSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-indigo-50">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
              <p className="text-gray-600 mb-6">Thank you for your inquiry. Our team will contact you shortly.</p>
              
              <button 
                onClick={() => {
                  const itemsList = cart.map(i => `${i.quantity}x ${i.name}`).join('%0A');
                  const text = `*New Order Inquiry*%0A%0A*Customer:* ${formData.customer_name}%0A*Phone:* ${formData.customer_phone}%0A*Address:* ${formData.customer_address}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ₹${totalAmount.toLocaleString()}`;
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                  
                  setCart([]);
                  setOrderSuccess(false);
                  setFormData({ customer_name: '', customer_phone: '', customer_address: '' });
                  onClose();
                }}
                className="bg-[#25D366] hover:bg-[#1ebe5d] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                Share via WhatsApp
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Package className="w-12 h-12 mb-4 opacity-20" />
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-white">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                            </div>
                            <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center border border-gray-200 rounded-lg">
                              <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
                              <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
                            </div>
                            <span className="font-bold text-gray-900">₹{(item.price_inr * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout Form */}
              {cart.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input 
                        type="text" required placeholder="Full Name" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <input 
                        type="tel" required placeholder="Phone Number" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <textarea 
                        required placeholder="Delivery Address" rows="3"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                        value={formData.customer_address} onChange={e => setFormData({...formData, customer_address: e.target.value})}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30"
                    >
                      {isSubmitting ? 'Processing...' : 'Place Inquiry / Order'}
                      {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;

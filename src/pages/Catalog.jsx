import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Search, SlidersHorizontal, ShoppingCart, AlertCircle, RefreshCw } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showColdStartNotice, setShowColdStartNotice] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    let timer;
    fetchProducts();
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    setShowColdStartNotice(false);

    // Agar 4 second tak data load na ho, toh cold start notice show karein
    const timer = setTimeout(() => {
      setShowColdStartNotice(true);
    }, 4000);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError('Could not connect to server. Render free tier may still be spinning up.');
    } finally {
      clearTimeout(timer);
      setShowColdStartNotice(false);
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.in_stock, item.quantity + 1) } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  let filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (sortOrder === 'price-asc') {
    filteredProducts.sort((a, b) => a.price_inr - b.price_inr);
  } else if (sortOrder === 'price-desc') {
    filteredProducts.sort((a, b) => b.price_inr - a.price_inr);
  }

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pb-12">
      {/* Floating Cart Button (Mobile) */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-105 sm:hidden flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
            {cartItemsCount}
          </span>
        )}
      </button>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Showroom Catalog</h1>
          <p className="text-gray-500 text-lg">Discover our curated collection of premium furniture.</p>
        </div>
        
        {/* Actions Button for Desktop Cart */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl shadow-sm hover:shadow hover:border-gray-300 transition-all font-medium text-gray-700"
        >
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          View Cart
          {cartItemsCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-sm font-bold ml-1">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-20 z-30">
        
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
            placeholder="Search furniture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          {/* Categories */}
          <div className="flex overflow-x-auto pb-2 sm:pb-0 hide-scrollbar gap-2 w-full lg:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  categoryFilter === cat 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer font-medium w-full"
            >
              <option value="default">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid / Loading / Error State */}
      {loading ? (
        <div className="py-4">
          {/* Server Wakeup Notice Banner */}
          {showColdStartNotice && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center justify-center gap-3 shadow-sm animate-pulse text-center">
              <span>⚡ Server sleep mode se wake up ho raha hai (free cloud tier), kripya 20-30 seconds wait karein...</span>
            </div>
          )}

          {/* Modern Skeleton Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse space-y-4">
                <div className="bg-gray-200 h-48 rounded-xl w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-red-100 p-8 max-w-md mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Catalog Load Failed</h3>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button 
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria.</p>
          <button 
            onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            className="mt-6 text-indigo-600 font-medium hover:text-indigo-800"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        setCart={setCart}
      />
    </div>
  );
};

export default Catalog;

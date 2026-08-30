import { ShoppingBag, Ruler } from 'lucide-react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {product.in_stock < 5 && product.in_stock > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            Only {product.in_stock} left
          </div>
        )}
        {product.in_stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white text-gray-900 font-bold px-4 py-2 rounded-lg shadow-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1">{product.category}</p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h3>
          </div>
          <p className="text-xl font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">₹{product.price_inr.toLocaleString()}</p>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">{product.description}</p>
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <Ruler className="w-4 h-4 mr-2 opacity-70" />
            <span>{product.dimensions}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-4 h-4 mr-2 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center opacity-70">
               <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
            <span className="truncate">{product.material}</span>
          </div>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={product.in_stock === 0}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            product.in_stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {product.in_stock === 0 ? 'Out of Stock' : 'Add to Inquiry / Order'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

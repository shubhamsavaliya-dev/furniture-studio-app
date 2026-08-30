import { Link, useLocation } from 'react-router-dom';
import { Sofa, LayoutDashboard, ShoppingCart, Paintbrush } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-indigo-500 hover:bg-gray-50';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Sofa className="h-8 w-8 text-indigo-600" />
                <span className="font-bold text-xl text-gray-900 tracking-tight">LuxeFurnish</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link to="/" className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive('/')}`}>
                <Sofa className="w-4 h-4 mr-2" />
                Showroom Catalog
              </Link>
              <Link to="/studio" className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive('/studio')}`}>
                <Paintbrush className="w-4 h-4 mr-2" />
                Custom AI Studio
              </Link>
              <Link to="/admin" className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive('/admin')}`}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Showroom Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center">
             <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors relative group">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-indigo-600 rounded-full group-hover:bg-indigo-700">0</span>
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import AdminDashboard from './pages/AdminDashboard';
import CustomStudio from './pages/CustomStudio';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/studio" element={<CustomStudio />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

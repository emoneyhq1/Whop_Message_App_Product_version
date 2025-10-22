import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from "axios";
import LoadingSpinner from '../components/LoadingSpinner';
type Product = {
  id: string;
  title?: string;
  visibility?: string;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeByProduct, setActiveByProduct] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const getProducts = async () => {
    try {
      setLoading(true);
      console.log("baseUrl", baseUrl);
      const res = await axios.get(`${baseUrl}/api/products`);
      const data = res.data
      if (data.error) throw new Error(data.error);
      setProducts(data.products || []);
      setActiveByProduct(data.activeByProduct || {});
      toast.success(`Loaded ${data.products?.length || 0} products successfully`);
    } catch (e: any) {
      setError(e.message);
      toast.error(`Failed to load products: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-600 text-[25px] tracking-tight font-mono">Products</h1>
            <div className="text-sm font-medium text-red-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              {products.length}<span className="text-gray-500 text-[15px]"> total</span>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-gray-100 rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading products..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                    No
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                    Title
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                    Active Users
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 text-[15px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {products.length > 0 ? (
                  products.map((p, index) => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-1 text-center border-r border-gray-300 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-1 border-r border-gray-300 border-b border-gray-200">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[20rem]">
                          {p.title || 'Untitled Product'}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                        <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300 truncate max-w-[16rem]">
                          {p.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${p.visibility === 'visible'
                          ? 'bg-emerald-100 text-emerald-800 '
                          : p.visibility === 'hidden'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {p.visibility || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">
                          {activeByProduct[p.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border-b border-gray-200">
                        <Link
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                          to={`/products/${p.id}`}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500 colSpan={6} border-b border-gray-200">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">No products found</p>
                        <p className="text-xs text-gray-500 mt-1">Products will appear here once they're added</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



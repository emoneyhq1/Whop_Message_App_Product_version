import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const baseUrl = import.meta.env.VITE_BACKEND_URL;
type Product = { id: string; title?: string; visibility?: string; activeUsers?: number };
type Membership = { id: string; user?: string; email?: string };

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${baseUrl}/api/products/${productId}`);
        if (data.error) throw new Error(data.error);
        setProduct(data.product || null);
        setMemberships(data.memberships || []);
        toast.success(`Product details loaded successfully`);
      } catch (e: any) {
        setError(e.message);
        toast.error(`Failed to load product details: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center justify-center space-x-4">
                <Link 
                to="/products" 
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ← Back to Products
              </Link>
              <h1 className="text-2xl text-center pl-55 font-bold text-gray-600 text-[35px] tracking-tight font-mono">Product Details</h1>
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading product details..." />
          </div>
        ) : product && (
          <>
            {/* Top Section - Product Info and Message Side by Side */}
            <div className="w-[1000px] flex flex-col lg:flex-row gap-6 mb-6">
              {/* Product Information Table */}
              <div className="flex-1 bg-gray-100 rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-center font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                          Field
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="hover:bg-gray-50 transition-colors duration-150 bg-white">
                        <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-600">Product ID</span>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                          <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300 truncate max-w-[16rem]">
                            {product.id}
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors duration-150 bg-gray-50">
                        <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-600">Title</span>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[20rem]">
                            {product.title || 'Untitled Product'}
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors duration-150 bg-white">
                        <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-600">Visibility</span>
                        </td>
                        <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.visibility === 'visible'
                            ? 'bg-emerald-100 text-emerald-800 '
                            : product.visibility === 'hidden'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {product.visibility || '—'}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors duration-150 bg-gray-50">
                        <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-600">Active Users</span>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-300 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">
                            {product.activeUsers ?? 0}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Direct Message Section */}
              <div className="flex-1 bg-gray-100 rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
                <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[20px] font-mono">Send Direct Message</h3>
                </div>
                <div className="bg-white p-4">
                  {result && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">{result}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      rows={4}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sending}
                    />
                    <button
                      className="w-full inline-flex items-center justify-center h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
                      onClick={async () => {
                        setError(null);
                        setResult(null);
                        if (!productId) return;
                        const trimmed = message.trim();
                        if (!trimmed) {
                          setError('Message cannot be empty');
                          toast.error('Message cannot be empty');
                          return;
                        }
                        try {
                          setSending(true);
                          toast.loading('Sending message...');
                          const { data } = await axios.post(`${baseUrl}/api/products/${productId}/message`, { message: trimmed });
                          if (data.error) throw new Error(data.error);
                          const { successCount = 0, errorCount = 0 } = data;
                          setResult(`Sent to ${successCount} member(s), ${errorCount} failed`);
                          setMessage('');
                          if (errorCount > 0) {
                            toast.warning(`Message sent to ${successCount} members, ${errorCount} failed`);
                          } else {
                            toast.success(`Message sent successfully to ${successCount} members`);
                          }
                        } catch (e: any) {
                          setError(e.message || 'Failed to send message');
                          toast.error(`Failed to send message: ${e.message || 'Unknown error'}`);
                        } finally {
                          setSending(false);
                        }
                      }}
                      disabled={sending}
                    >
                      {sending ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Memberships Table */}
            <div className="w-[1000px] bg-gray-100 rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-[20px] font-mono">Memberships ({memberships.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-center font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                        No
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                        Membership ID
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-r border-gray-300 border-b border-gray-300 text-[15px]">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 text-[15px]">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {memberships.length > 0 ? (
                      memberships.map((m, index) => (
                        <tr key={m.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-1 text-center border-r border-gray-300 border-b border-gray-200">
                            <span className="text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                            <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-300 truncate max-w-[16rem]">
                              {m.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300 border-b border-gray-200">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[20rem]">
                              {m.user || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[20rem]">
                              {m.email || '—'}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-8 text-center text-gray-500 colSpan={4} border-b border-gray-200">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-900">No memberships found</p>
                            <p className="text-xs text-gray-500 mt-1">Memberships will appear here once they're added</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



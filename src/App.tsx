import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-green-600 text-[30px] tracking-tight font-mono">Whop Message App</h1>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-1">
        {children}
      </main>
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">Whop Message App</p>
        </div>
      </footer>
    </div>
  )
}

function ProductsPage() {
  return (
    <Layout>
      <Products />
    </Layout>
  )
}

function ProductDetailPage() {
  return (
    <Layout>
      <ProductDetail />
    </Layout>
  )
}

const routed = createBrowserRouter([
  { path: '/', element: <ProductsPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/products/:productId', element: <ProductDetailPage /> },
])

export default function App() {
  return (
    <>
      <RouterProvider router={routed} />
      <Toaster richColors position="top-right" />
    </>
  )
}


import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 text-center">
        <h2 className="text-6xl font-bold text-blue-400 mb-4">404</h2>
        <h3 className="text-2xl font-semibold text-gray-200 mb-4">Page Not Found</h3>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}





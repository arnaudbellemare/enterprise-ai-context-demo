'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong!</h2>
          <p className="text-gray-300 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}



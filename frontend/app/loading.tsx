export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500 mb-4"></div>
        <p className="text-gray-300 text-lg">Loading...</p>
      </div>
    </div>
  )
}



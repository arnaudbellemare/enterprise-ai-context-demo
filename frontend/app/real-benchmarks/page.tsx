'use client';

export default function RealBenchmarksPage() {
  // Redirect to the real edge test page
  if (typeof window !== 'undefined') {
    window.location.href = '/real-edge-test';
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Real Edge Test...</h1>
        <p className="text-sm">If you're not redirected, <a href="/real-edge-test" className="underline">click here</a></p>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-slate-500 mb-8">Page not found</p>
        <Link href="/" className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold">Return Home</Link>
      </div>
    </div>
  );
}

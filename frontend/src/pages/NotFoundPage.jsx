import { Link } from "react-router-dom";
import { MdSchool, MdArrowBack } from "react-icons/md";
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MdSchool size={30} className="text-indigo-500"/>
        </div>
        <p className="text-7xl font-extrabold text-slate-900 mb-2">404</p>
        <p className="text-slate-500 text-sm mb-8">This page doesn't exist or you don't have access.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition text-sm">
          <MdArrowBack size={16}/>Go Home
        </Link>
      </div>
    </div>
  );
}

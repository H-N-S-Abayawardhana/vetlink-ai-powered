export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0B1020] text-slate-50 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-10rem] h-72 w-[40rem] rounded-full bg-[#7C7CFF]/10 blur-3xl" />
        <div className="absolute -bottom-24 right-[-10rem] h-72 w-[40rem] rounded-full bg-[#00E5FF]/10 blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-white/10 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] bg-clip-text text-transparent">VetLink</span>
            </h3>
            <p className="text-gray-300 mb-4">
              Smart pet healthcare management system powered by AI technology.
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a href="https://instagram.com/vetlink" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-gray-300 hover:text-slate-50 hover:bg-white/5 transition-all cursor-pointer ring-1 ring-transparent hover:ring-white/10 hover:shadow-[0_0_0_1px_rgba(124,124,255,0.18),0_14px_30px_-18px_rgba(124,124,255,0.35)]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              {/* Facebook */}
              <a href="https://facebook.com/vetlink" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-gray-300 hover:text-slate-50 hover:bg-white/5 transition-all cursor-pointer ring-1 ring-transparent hover:ring-white/10 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.18),0_14px_30px_-18px_rgba(0,229,255,0.35)]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              
              {/* X (Twitter) */}
              <a href="https://x.com/vetlink" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-gray-300 hover:text-slate-50 hover:bg-white/5 transition-all cursor-pointer ring-1 ring-transparent hover:ring-white/10 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.18),0_14px_30px_-18px_rgba(45,212,191,0.35)]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a href="https://linkedin.com/company/vetlink" target="_blank" rel="noopener noreferrer" className="rounded-xl p-2 text-gray-300 hover:text-slate-50 hover:bg-white/5 transition-all cursor-pointer ring-1 ring-transparent hover:ring-white/10 hover:shadow-[0_0_0_1px_rgba(124,124,255,0.18),0_14px_30px_-18px_rgba(124,124,255,0.35)]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#features" className="hover:text-slate-50 transition-colors cursor-pointer">Skin Care Detection</a></li>
              <li><a href="#features" className="hover:text-slate-50 transition-colors cursor-pointer">Anomaly Detection</a></li>
              <li><a href="#features" className="hover:text-slate-50 transition-colors cursor-pointer">AI Diet Plans</a></li>
              <li><a href="#features" className="hover:text-slate-50 transition-colors cursor-pointer">Intelligent Pharmacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-slate-50 transition-colors cursor-pointer">Help Center</a></li>
              <li><a href="#contact" className="hover:text-slate-50 transition-colors cursor-pointer">Contact Us</a></li>
              <li><a href="#" className="hover:text-slate-50 transition-colors cursor-pointer">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-50 transition-colors cursor-pointer">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Email: info@vetlink.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Pet Care Ave</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 VetLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

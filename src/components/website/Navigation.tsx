"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Menu, Sparkles, UserPlus, X } from "lucide-react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      } 
      // Hide header when scrolling down (but not at the very top)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('nav')) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className={`fixed w-full top-0 z-50 transition-transform duration-300 ease-in-out ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="absolute inset-0 bg-[#0B1020]/70 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_-30px_rgba(0,229,255,0.35)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
            <Link href="/" passHref>
                <Image
                  src="/vetlink_logo.png"
                  alt="VetLink Logo"
                  width={160}
                  height={56}
                  className="h-10 sm:h-11 lg:h-12 w-auto cursor-pointer opacity-95 hover:opacity-100 transition-opacity"
                  priority
                />
              </Link>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block flex-1">
            <div className="flex items-center justify-center space-x-6">
              <a href="#features" className="group relative text-gray-300 hover:text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Features
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a href="#about" className="group relative text-gray-300 hover:text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                About
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a href="#pricing" className="group relative text-gray-300 hover:text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Pricing
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#2DD4BF]/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a href="#testimonials" className="group relative text-gray-300 hover:text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Testimonials
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#7C7CFF]/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
              <a href="#contact" className="group relative text-gray-300 hover:text-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                Contact
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00E5FF]/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Sign In & Sign Up Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <a href="/signin" className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-50 ring-1 ring-white/15 transition-all hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.22),0_14px_30px_-18px_rgba(0,229,255,0.45)]">
              <LogIn className="h-4 w-4 text-[#00E5FF]" />
              Sign In
            </a>
            <a href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] px-4 py-2 text-sm font-semibold text-[#0B1020] transition-all hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35),0_14px_30px_-18px_rgba(0,229,255,0.55)]">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-slate-50 hover:text-slate-50 hover:bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/60 transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="px-2 pt-3 pb-5 space-y-2 sm:px-3 bg-[#0B1020]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_20px_70px_-45px_rgba(0,229,255,0.45)]">
              <a 
                href="#features" 
                className="text-gray-200 hover:text-slate-50 hover:bg-white/5 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#about" 
                className="text-gray-200 hover:text-slate-50 hover:bg-white/5 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#pricing" 
                className="text-gray-200 hover:text-slate-50 hover:bg-white/5 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#testimonials" 
                className="text-gray-200 hover:text-slate-50 hover:bg-white/5 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <a 
                href="#contact" 
                className="text-gray-200 hover:text-slate-50 hover:bg-white/5 block px-4 py-4 rounded-xl text-base font-semibold transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <div className="pt-3 border-t border-white/10 space-y-2">
                <a 
                  href="/signin" 
                  className="bg-white/5 text-slate-50 block px-4 py-4 rounded-xl text-base font-semibold hover:bg-white/10 transition-colors text-center touch-manipulation ring-1 ring-white/15"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <LogIn className="h-4.5 w-4.5 text-[#00E5FF]" />
                    Sign In
                  </span>
                </a>
                <a 
                  href="/signup" 
                  className="bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] text-[#0B1020] block px-4 py-4 rounded-xl text-base font-semibold transition-all text-center touch-manipulation hover:brightness-110"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Sparkles className="h-4.5 w-4.5" />
                    Sign Up
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

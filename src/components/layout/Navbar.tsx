"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading, logOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "AI Summarizer", href: "/summarize-pdf" },
  ];

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav
      className={`sticky top-0 z-[99999] w-full transition-all duration-500 ${
        scrolled
          ? "glass-nav shadow-lg shadow-black/20"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
          <div className="relative h-12 w-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Image
              src="/logo-v2.png"
              alt="PDify Logo"
              fill
              className="object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            />
          </div>
          <span className="text-xl font-bold text-gradient tracking-tight">
            PDify
          </span>
        </Link>

        {/* Desktop Interface */}
        <div className="hidden md:flex md:items-center md:space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/[0.06] group"
            >
              {link.name}
              <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          ))}
          <a
            href="#tools"
            className="ml-3 text-sm font-semibold text-white bg-gradient-brand px-5 py-2 rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 shimmer"
          >
            All Tools
          </a>

          {/* Auth Buttons */}
          <div className="ml-4 flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-20 rounded-full bg-white/[0.04] animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-slate-300 max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-full hover:bg-red-500/[0.06] transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-full border border-white/[0.08] hover:bg-white/[0.06] transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 rounded-full shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={`h-6 w-6 absolute transition-all duration-300 ${
                  isOpen
                    ? "opacity-0 rotate-90 scale-50"
                    : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`h-6 w-6 absolute transition-all duration-300 ${
                  isOpen
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-50"
                }`}
              />
            </div>
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-[99999] w-full max-w-[300px] bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl transform transition-transform duration-400 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <span className="text-lg font-bold text-white tracking-tight">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-2 -mr-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-xl px-4 py-3.5 text-base font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all"
              onClick={() => setIsOpen(false)}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {link.name}
            </Link>
          ))}
          <a
            href="#tools"
            className="block text-center mt-6 text-sm font-semibold text-white bg-gradient-brand px-5 py-3.5 rounded-xl shadow-md shadow-blue-500/20"
            onClick={() => setIsOpen(false)}
          >
            View All Tools →
          </a>
        </div>

        {/* Mobile Auth */}
        <div className="p-6 border-t border-white/[0.06] bg-slate-900/30">
          {loading ? null : user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Signed in as</span>
                  <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] border border-red-500/20 px-4 py-3.5 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                className="block text-center text-sm font-bold text-slate-300 border border-white/[0.08] hover:bg-white/[0.06] px-5 py-3.5 rounded-xl transition-all"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block text-center text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 rounded-xl shadow-md shadow-violet-500/20"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

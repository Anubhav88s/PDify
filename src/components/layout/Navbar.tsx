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
    { name: "Merge PDF", href: "/merge-pdf" },
    { name: "Split PDF", href: "/split-pdf" },
    { name: "Compress PDF", href: "/compress-pdf" },
    { name: "Convert PDF", href: "/convert-pdf" },
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
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "glass-nav shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex h-16 w-full items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2.5 group">
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
          <Link
            href="/#tools"
            className="ml-3 text-sm font-semibold text-white bg-gradient-brand px-5 py-2 rounded-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 shimmer"
          >
            All Tools
          </Link>

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

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1 px-6 pb-5 pt-3 bg-slate-950/95 border-b border-white/5 backdrop-blur-2xl">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-xl px-4 py-3 text-base font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white transition-all"
              onClick={() => setIsOpen(false)}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/#tools"
            className="block text-center mt-3 text-sm font-semibold text-white bg-gradient-brand px-5 py-3 rounded-xl shadow-md shadow-blue-500/20"
            onClick={() => setIsOpen(false)}
          >
            View All Tools →
          </Link>

          {/* Mobile Auth */}
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            {loading ? null : user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-300 truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm font-medium text-red-400 hover:bg-red-500/[0.06] px-4 py-3 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block text-center text-sm font-medium text-slate-300 border border-white/[0.08] hover:bg-white/[0.06] px-5 py-3 rounded-xl transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block text-center text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 rounded-xl shadow-md shadow-violet-500/20"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

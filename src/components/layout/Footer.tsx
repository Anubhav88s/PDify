import Link from "next/link";
import Image from "next/image";
import { Twitter, Youtube, Instagram, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] bg-slate-950/80 backdrop-blur-2xl">
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center space-x-2.5 group">
              <div className="relative h-9 w-9 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Image
                  src="/logo.png"
                  alt="PDify Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold text-gradient">PDify</span>
            </div>
            <p className="text-sm leading-6 text-slate-500 max-w-sm">
              Empowering your document workflow with secure, fast, and free PDF
              tools. Building the future of file management, one click at a
              time.
            </p>
            {/* Social links */}
            <div className="flex gap-2">
              {[
                { icon: Twitter, label: "X", href: "#" },
                { icon: Youtube, label: "YouTube", href: "#" },
                { icon: Instagram, label: "Instagram", href: "#" },
                { icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                >
                  <span className="sr-only">{social.label}</span>
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Explore Section */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-5">
              Explore
            </h3>
            <ul role="list" className="space-y-3">
              {[
                { name: "All Tools", href: "/#tools" },
                { name: "Merge PDF", href: "/merge-pdf" },
                { name: "Split PDF", href: "/split-pdf" },
                { name: "Compress PDF", href: "/compress-pdf" },
                { name: "Convert PDF", href: "/convert-pdf" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in Touch Section */}
          <div>
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-5">
              Get in Touch
            </h3>
            <ul role="list" className="space-y-3">
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <a
                  href="mailto:contact@pdify.tech"
                  className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
                >
                  contact@pdify.tech
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 flex items-center gap-1">
            &copy; {new Date().getFullYear()} PDify. Made with{" "}
            <Heart className="h-3 w-3 text-blue-500 fill-blue-500 inline" />{" "}
            All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

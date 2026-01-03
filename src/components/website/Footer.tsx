"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, ExternalLink, Github } from "lucide-react";

export default function Footer() {
  const footerLinks = {
    modules: [
      { name: "Skin Disease + Severity", href: "/dashboard/skin-disease" },
      { name: "Mobility & Limping", href: "/dashboard/Limping" },
      { name: "Pharmacy Forecasting", href: "/dashboard/pharmacy" },
      { name: "Health Assessment (BCS)", href: "/dashboard/pets/bcs" },
    ],
    resources: [
      {
        name: "Live Demo",
        href: "https://vet-link.vercel.app/",
        external: true,
      },
      {
        name: "GitHub Repository",
        href: "https://github.com/H-N-S-Abayawardhana/vetlink-ai-powered",
        external: true,
      },
      {
        name: "Architecture Diagram",
        href: "https://drive.google.com/file/d/1qwxUK4363bIKMenpspJjJ22fCEM8bsJa/view?usp=sharing",
        external: true,
      },
      { name: "Deployments", href: "#deployments", external: false },
    ],
  };

  const quickLinks = [
    {
      name: "Live Demo",
      href: "https://vet-link.vercel.app/",
      icon: ExternalLink,
    },
    {
      name: "GitHub",
      href: "https://github.com/H-N-S-Abayawardhana/vetlink-ai-powered",
      icon: Github,
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 text-gray-900 py-16 sm:py-20 border-t border-gray-200/60">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4 cursor-pointer">
              <div className="flex items-center gap-2">
                <Image
                  src="/vetlink_logo.png"
                  alt="VetLink Logo"
                  width={140}
                  height={50}
                  className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
                />
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-100/50">
                  <Brain className="h-3 w-3 text-indigo-600" />
                  <span className="text-xs font-semibold text-indigo-700">
                    AI
                  </span>
                </div>
              </div>
            </Link>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              AI-powered pet healthcare platform for skin disease detection,
              mobility analysis, pharmacy forecasting, and health assessment.
            </p>
            <div className="flex space-x-3">
              {quickLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all ring-1 ring-transparent hover:ring-indigo-200/50 cursor-pointer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Modules
            </h4>
            <ul className="space-y-3">
              {footerLinks.modules.map((link, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-indigo-600 transition-colors text-sm cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-indigo-600 transition-colors text-sm cursor-pointer"
                    >
                      {link.name}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-indigo-600 transition-colors text-sm cursor-pointer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-indigo-600 transition-colors text-sm cursor-pointer"
                    >
                      {link.name}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Get started */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Get started
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Try the platform, explore the deployments, or jump into the code.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
              >
                Create an account
              </Link>
              <a
                href="#deployments"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200/60 hover:ring-indigo-200/60 hover:bg-gray-50 transition-all cursor-pointer"
              >
                View deployments
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200/60 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} VetLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

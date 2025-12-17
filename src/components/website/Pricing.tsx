"use client";

import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-20 bg-gray-50"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -bottom-24 right-[-8rem] h-80 w-[42rem] rounded-full bg-blue-50/50 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Flexible pricing options for pet owners, pharmacies, and veterinary
            clinics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pet Owners Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>

            <div className="relative p-6 text-center border-b border-gray-200">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <Sparkles className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Pet Owners
              </h3>
              <p className="text-sm text-gray-600">B2C SAAS</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  Free
                </div>
                <div className="text-gray-600 mb-4">Basic Plan</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  LKR 2,400
                </div>
                <div className="text-gray-500">Premium Monthly</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">
                    AI skin disease detection
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">
                    Behavioral tracking & alerts
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Personalized diet plans</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Nearby pharmacy finder</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Health score dashboard</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                <p className="text-sm text-gray-900 font-semibold mb-2">
                  Tele-vet Consultations
                </p>
                <p className="text-sm text-gray-600">
                  LKR 4,500 - 7,500 per session
                </p>
              </div>

              <button className="w-full rounded-xl bg-white text-gray-700 py-3 font-semibold ring-1 ring-gray-200 transition-all duration-200 cursor-pointer hover:bg-blue-700 hover:text-white hover:ring-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
                Start Free Trial
              </button>
            </div>
          </motion.div>

          {/* Pet Pharmacies Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border-2 border-blue-700 bg-white shadow-md overflow-hidden transition-all hover:shadow-lg"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-2 ring-blue-200/50" />
            </div>

            <div className="relative p-6 text-center border-b border-gray-200">
              <div className="absolute left-1/2 top-4 -translate-x-1/2">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white ring-1 ring-blue-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  Most Popular
                </span>
              </div>

              <div className="mx-auto mb-4 mt-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <Sparkles className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Pet Pharmacies
              </h3>
              <p className="text-sm text-gray-600">B2B COMMERCE</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  LKR 10K
                </div>
                <div className="text-gray-500">Monthly Subscription</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Inventory management</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">
                    Real-time clinic integration
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">AI demand forecasting</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Automated reordering</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Targeted promotions</span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-6">
                <p className="text-sm text-gray-900 font-semibold mb-2">
                  Revenue Share
                </p>
                <p className="text-sm text-gray-600">
                  SaaS License + 3% transaction commission
                </p>
              </div>

              <button className="w-full rounded-xl bg-blue-700 text-white py-3 font-semibold transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:shadow-md hover:shadow-blue-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/70">
                Contact Sales
              </button>
            </div>
          </motion.div>

          {/* Veterinary Clinics Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
              <div className="absolute inset-0 ring-1 ring-blue-200/50" />
            </div>

            <div className="relative p-6 text-center border-b border-gray-200">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Veterinary Clinics
              </h3>
              <p className="text-sm text-gray-600">B2B PROFESSIONAL</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  Starting
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  LKR 20K
                </div>
                <div className="text-gray-500">Monthly Subscription</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">AI-assisted diagnostics</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Patient health records</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Analytics dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Pharmacy integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <span className="text-gray-600">Multi-branch support</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                <p className="text-sm text-gray-900 font-semibold mb-2">
                  Tiered SaaS
                </p>
                <p className="text-sm text-gray-600">
                  Flexible pricing based on clinic size
                </p>
              </div>

              <button className="w-full rounded-xl bg-white text-gray-700 py-3 font-semibold ring-1 ring-gray-200 transition-all duration-200 cursor-pointer hover:bg-blue-700 hover:text-white hover:ring-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
                Get Custom Quote
              </button>
            </div>
          </motion.div>
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            All plans include 24/7 support and regular updates
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>✓ Free setup & onboarding</span>
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ Enterprise-grade security</span>
            <span>✓ API access available</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 bg-[#0B1020]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#7C7CFF]/20 blur-3xl" />
        <div className="absolute -bottom-24 right-[-8rem] h-80 w-[42rem] rounded-full bg-[#00E5FF]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,124,255,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,229,255,0.10),transparent_55%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            Choose Your Plan
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Flexible pricing options for pet owners, pharmacies, and veterinary clinics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pet Owners Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.20),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#00E5FF]/30" />
              <div className="absolute -inset-10 bg-[#00E5FF]/10 blur-2xl" />
            </div>

            <div className="relative p-6 text-center border-b border-white/10">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-6 w-6 text-[#00E5FF]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-50 mb-1">Pet Owners</h3>
              <p className="text-sm text-gray-300">B2C SAAS</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-slate-50 mb-2">Free</div>
                <div className="text-gray-300 mb-4">Basic Plan</div>
                <div className="text-3xl font-bold text-[#00E5FF] mb-1">LKR 2,400</div>
                <div className="text-gray-400">Premium Monthly</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">AI skin disease detection</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Behavioral tracking & alerts</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Personalized diet plans</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Nearby pharmacy finder</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Health score dashboard</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
                <p className="text-sm text-slate-50 font-semibold mb-2">Tele-vet Consultations</p>
                <p className="text-sm text-gray-300">LKR 4,500 - 7,500 per session</p>
              </div>

              <button className="w-full rounded-xl bg-white/10 text-slate-50 py-3 font-semibold ring-1 ring-white/15 transition-all duration-200 cursor-pointer hover:bg-gradient-to-r hover:from-[#00E5FF] hover:to-[#2DD4BF] hover:text-[#0B1020] hover:ring-transparent hover:shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_18px_40px_-18px_rgba(0,229,255,0.50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]/60">
                Start Free Trial
              </button>
            </div>
          </motion.div>

          {/* Pet Pharmacies Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
            whileHover={{ y: -8, scale: 1.03 }}
            className="group relative rounded-2xl border border-[#2DD4BF]/40 bg-white/6 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.22),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#2DD4BF]/45" />
              <div className="absolute -inset-10 bg-[#2DD4BF]/10 blur-2xl" />
            </div>

            <div className="relative p-6 text-center border-b border-white/10">
              <div className="absolute left-1/2 top-4 -translate-x-1/2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#2DD4BF]/15 px-3 py-1 text-xs font-semibold text-[#2DD4BF] ring-1 ring-[#2DD4BF]/35">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
                  Most Popular
                </span>
              </div>

              <div className="mx-auto mb-4 mt-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-6 w-6 text-[#2DD4BF]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-50 mb-1">Pet Pharmacies</h3>
              <p className="text-sm text-gray-300">B2B COMMERCE</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-slate-50 mb-1">LKR 10K</div>
                <div className="text-gray-400">Monthly Subscription</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Inventory management</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Real-time clinic integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">AI demand forecasting</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Automated reordering</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Targeted promotions</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#2DD4BF]/25 bg-white/5 p-4 mb-6">
                <p className="text-sm text-slate-50 font-semibold mb-2">Revenue Share</p>
                <p className="text-sm text-gray-300">SaaS License + 3% transaction commission</p>
              </div>

              <button className="w-full rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] text-[#0B1020] py-3 font-semibold transition-all duration-200 cursor-pointer hover:shadow-[0_0_0_1px_rgba(45,212,191,0.40),0_18px_40px_-18px_rgba(0,229,255,0.55)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]/70">
                Contact Sales
              </button>
            </div>
          </motion.div>

          {/* Veterinary Clinics Plan */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.015 }}
            className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,124,255,0.20),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-[#7C7CFF]/35" />
              <div className="absolute -inset-10 bg-[#7C7CFF]/10 blur-2xl" />
            </div>

            <div className="relative p-6 text-center border-b border-white/10">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-6 w-6 text-[#7C7CFF]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-50 mb-1">Veterinary Clinics</h3>
              <p className="text-sm text-gray-300">B2B PROFESSIONAL</p>
            </div>

            <div className="relative p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-slate-50 mb-1">Starting</div>
                <div className="text-3xl font-bold text-[#00E5FF] mb-1">LKR 20K</div>
                <div className="text-gray-400">Monthly Subscription</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">AI-assisted diagnostics</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Patient health records</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Analytics dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Pharmacy integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-[#2DD4BF]" />
                  <span className="text-gray-300">Multi-branch support</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
                <p className="text-sm text-slate-50 font-semibold mb-2">Tiered SaaS</p>
                <p className="text-sm text-gray-300">Flexible pricing based on clinic size</p>
              </div>

              <button className="w-full rounded-xl bg-white/10 text-slate-50 py-3 font-semibold ring-1 ring-white/15 transition-all duration-200 cursor-pointer hover:bg-gradient-to-r hover:from-[#00E5FF] hover:to-[#2DD4BF] hover:text-[#0B1020] hover:ring-transparent hover:shadow-[0_0_0_1px_rgba(124,124,255,0.28),0_18px_40px_-18px_rgba(124,124,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7CFF]/60">
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
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          className="text-center mt-12"
        >
          <p className="text-gray-300 mb-4">All plans include 24/7 support and regular updates</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
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

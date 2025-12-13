'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mail, MessageSquareText, PawPrint, Sparkles, User } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend only - form submission logic would go here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="relative overflow-hidden py-20 bg-[#0B1020]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-10rem] h-80 w-[42rem] rounded-full bg-[#00E5FF]/15 blur-3xl" />
        <div className="absolute -bottom-24 left-[-10rem] h-80 w-[42rem] rounded-full bg-[#7C7CFF]/18 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.10),transparent_55%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            Ready to Transform Your Pet's Healthcare?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of pet owners who trust VetLink for their pets' health and wellbeing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] text-[#0B1020] px-8 py-3 text-lg font-semibold transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_18px_40px_-18px_rgba(0,229,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]/60">
              Start Free Trial
            </button>
            <button className="rounded-xl bg-white/5 text-slate-50 px-8 py-3 text-lg font-semibold ring-1 ring-white/15 transition-all duration-200 cursor-pointer hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(124,124,255,0.22),0_18px_40px_-18px_rgba(124,124,255,0.40)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C7CFF]/60">
              Contact Sales
            </button>
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Visual panel (UI only) */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
              <div className="pointer-events-none absolute -top-16 -right-24 h-64 w-64 rounded-full bg-[#00E5FF]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-24 h-64 w-64 rounded-full bg-[#7C7CFF]/12 blur-3xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Brain className="h-5 w-5 text-[#00E5FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">AI-Powered Pet Healthcare</p>
                  <h3 className="text-xl font-bold text-slate-50">Get in Touch</h3>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-7">
                Have questions about VetLink? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <Sparkles className="h-4.5 w-4.5 text-[#2DD4BF]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-50">Fast answers</p>
                    <p className="text-sm text-gray-400">Get clear guidance from a team that understands pets and AI.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                    <PawPrint className="h-4.5 w-4.5 text-[#00E5FF]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-50">Trusted care</p>
                    <p className="text-sm text-gray-400">Designed for pet owners, clinics, and pharmacies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 sm:p-8 shadow-[0_20px_60px_-35px_rgba(0,229,255,0.35)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-[#00E5FF]">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#00E5FF]" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white/5 px-11 py-3 text-slate-50 placeholder:text-gray-400 ring-1 ring-transparent focus:ring-2 focus:ring-[#00E5FF]/60 focus:outline-none transition-shadow"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-[#00E5FF]">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#00E5FF]" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white/5 px-11 py-3 text-slate-50 placeholder:text-gray-400 ring-1 ring-transparent focus:ring-2 focus:ring-[#00E5FF]/60 focus:outline-none transition-shadow"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2 transition-colors group-focus-within:text-[#00E5FF]">
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-4.5 w-4.5 text-gray-400 group-focus-within:text-[#00E5FF]" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full rounded-xl bg-white/5 px-11 py-3 text-slate-50 placeholder:text-gray-400 ring-1 ring-transparent focus:ring-2 focus:ring-[#00E5FF]/60 focus:outline-none transition-shadow resize-none"
                      placeholder="Tell us how we can help you and your pet..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#2DD4BF] text-[#0B1020] py-3 px-6 font-semibold transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_18px_40px_-18px_rgba(0,229,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]/60"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

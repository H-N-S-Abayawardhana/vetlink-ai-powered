"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Mail,
  MessageSquareText,
  PawPrint,
  Sparkles,
  User,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend only - form submission logic would go here
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-20 bg-gray-50"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-10rem] h-80 w-[42rem] rounded-full bg-blue-50/40 blur-3xl" />
        <div className="absolute -bottom-24 left-[-10rem] h-80 w-[42rem] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Ready to Transform Your Pet&apos;s Healthcare?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of pet owners who trust VetLink for their pets&apos;
            health and wellbeing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="rounded-xl bg-blue-700 text-white px-8 py-3 text-lg font-semibold transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:shadow-md hover:shadow-blue-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
              Start Free Trial
            </button>
            <button className="rounded-xl bg-white text-gray-700 px-8 py-3 text-lg font-semibold ring-1 ring-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:ring-blue-700/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60">
              Contact Sales
            </button>
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Visual panel (UI only) */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm p-7">
              <div className="pointer-events-none absolute -top-16 -right-24 h-64 w-64 rounded-full bg-blue-50/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-24 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                  <Brain className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    AI-Powered Pet Healthcare
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">
                    Get in Touch
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-7">
                Have questions about VetLink? We&apos;d love to hear from you. Send
                us a message and we&apos;ll respond as soon as possible.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
                    <Sparkles className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fast answers</p>
                    <p className="text-sm text-gray-500">
                      Get clear guidance from a team that understands pets and
                      AI.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
                    <PawPrint className="h-4.5 w-4.5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Trusted care</p>
                    <p className="text-sm text-gray-500">
                      Designed for pet owners, clinics, and pharmacies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-7 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-700"
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-700" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-700/60 focus:outline-none transition-shadow"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-700"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-700" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-700/60 focus:outline-none transition-shadow"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-700"
                  >
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-700" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full rounded-xl bg-white px-11 py-3 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-700/60 focus:outline-none transition-shadow resize-none"
                      placeholder="Tell us how we can help you and your pet..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-700 text-white py-3 px-6 font-semibold transition-all duration-200 cursor-pointer hover:bg-blue-800 hover:shadow-md hover:shadow-blue-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/60"
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

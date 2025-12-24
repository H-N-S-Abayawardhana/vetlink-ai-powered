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
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear status when user starts typing
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: data.message || "Your message has been sent successfully!",
        });
        setFormData({ name: "", email: "", message: "" });
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
        }, 5000);
      } else {
        setSubmitStatus({
          type: "error",
          message: data.error || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: "error",
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-24 sm:py-32 bg-gradient-to-b from-white via-gray-50/50 to-white"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              Pet&apos;s Healthcare?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of pet owners who trust VetLink for their pets&apos;
            health and wellbeing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <motion.a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="h-5 w-5" />
              Start Free Trial
            </motion.a>
            <motion.a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-3.5 text-lg font-semibold ring-1 ring-gray-200/60 transition-all hover:bg-white hover:ring-indigo-200/60 hover:shadow-md"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Contact Sales
            </motion.a>
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Visual panel */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-teal-50/20 rounded-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-1 ring-indigo-200/30">
                    <Brain className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      AI-Powered Pet Healthcare
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Get in Touch
                    </h3>
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed mb-8">
                  Have questions about VetLink? We&apos;d love to hear from you.
                  Send us a message and we&apos;ll respond as soon as possible.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: Sparkles,
                      title: "Fast answers",
                      description:
                        "Get clear guidance from a team that understands pets and AI.",
                    },
                    {
                      icon: PawPrint,
                      title: "Trusted care",
                      description:
                        "Designed for pet owners, clinics, and pharmacies.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-4 rounded-xl border border-gray-200/60 bg-white/50 p-4"
                    >
                      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-1 ring-indigo-200/30">
                        <item.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-700"
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white px-12 py-3.5 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200/60 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-700"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl bg-white px-12 py-3.5 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200/60 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-indigo-700"
                  >
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full rounded-xl bg-white px-12 py-4 text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200/60 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all resize-none"
                      placeholder="Tell us how we can help you and your pet..."
                    />
                  </div>
                </div>

                {/* Status Message */}
                {submitStatus.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 flex items-start gap-3 ${
                      submitStatus.type === "success"
                        ? "bg-teal-50 border border-teal-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {submitStatus.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        submitStatus.type === "success"
                          ? "text-teal-800"
                          : "text-red-800"
                      }`}
                    >
                      {submitStatus.message}
                    </p>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 px-6 font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

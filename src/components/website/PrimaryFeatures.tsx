"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, FileText, Headset, MessageCircle } from "lucide-react";

export default function PrimaryFeatures() {
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      id="primary-features"
      className="relative overflow-hidden py-12 md:py-16 bg-gray-50"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-10rem] h-72 w-[40rem] rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute -bottom-24 right-[-10rem] h-72 w-[40rem] rounded-full bg-blue-50/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={fadeUp}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Primary Features
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Essential pet care services that form the foundation of
            comprehensive veterinary healthcare
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          {/* Feature 1: Appointment Scheduling */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Appointment Scheduling
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  Book vet appointments instantly with smart scheduling and
                  automated reminders.
                </p>
                <div className="relative h-24 md:h-28 rounded-xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Appointment scheduling"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Health Records */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Digital Health Records
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  Maintain comprehensive digital health records and track
                  medical history securely.
                </p>
                <div className="relative h-24 md:h-28 rounded-xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Digital health records"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Emergency Support */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0">
                <Headset className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  24/7 Emergency Support
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  Get instant access to emergency veterinary support and first
                  aid guidance.
                </p>
                <div className="relative h-24 md:h-28 rounded-xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Emergency support"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Vet Consultation */}
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 transition-all hover:shadow-md"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Expert Vet Consultation
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-3">
                  Connect with certified veterinarians for professional advice
                  and remote diagnosis.
                </p>
                <div className="relative h-24 md:h-28 rounded-xl overflow-hidden ring-1 ring-gray-200">
                  <Image
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                    alt="Vet consultation"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

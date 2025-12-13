'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function Testimonials() {
  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section id="testimonials" className="relative overflow-hidden py-20 bg-[#0B1020]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-10rem] h-80 w-[42rem] rounded-full bg-[#7C7CFF]/16 blur-3xl" />
        <div className="absolute -bottom-24 right-[-10rem] h-80 w-[42rem] rounded-full bg-[#00E5FF]/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.10),transparent_55%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            What Pet Owners Say
          </h2>
          <p className="text-lg md:text-xl text-gray-300">
            Real stories from pet owners who trust VetLink with their pets&apos; health
          </p>
        </motion.div>

        {/* Desktop grid + mobile horizontal scroll */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          <div className="flex md:contents gap-5 overflow-x-auto md:overflow-visible pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
            {/* Card 1 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="Sarah Johnson"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">Sarah Johnson</h4>
                  <p className="text-gray-400">Dog Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "VetLink&apos;s skin detection feature helped me catch my dog&apos;s early-stage dermatitis.
                The AI recommendations were spot-on and saved us a costly vet visit!"
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="Mike Chen"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">Mike Chen</h4>
                  <p className="text-gray-400">Cat Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "The anomaly detection system alerted me when my cat started limping.
                Early detection meant faster treatment and a quicker recovery."
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="Emily Rodriguez"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">Emily Rodriguez</h4>
                  <p className="text-gray-400">Multi-Pet Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "The AI diet plans have been a game-changer for my pets&apos; health.
                Each of my three pets has a personalized nutrition plan that works perfectly!"
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.15 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="David Thompson"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">David Thompson</h4>
                  <p className="text-gray-400">Golden Retriever Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "The health monitoring dashboard gives me peace of mind. I can track my dog&apos;s activity levels,
                sleep patterns, and overall wellness trends all in one place."
              </p>
            </motion.div>

            {/* Card 5 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="Lisa Park"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">Lisa Park</h4>
                  <p className="text-gray-400">Persian Cat Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "VetLink&apos;s grooming recommendations are fantastic! My Persian cat&apos;s coat has never looked better.
                The AI suggested the perfect grooming schedule and products."
              </p>
            </motion.div>

            {/* Card 6 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.25 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="snap-start md:snap-none shrink-0 md:shrink flex-none md:flex-auto w-[86%] sm:w-[70%] md:w-auto group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-7"
            >
              <Quote className="pointer-events-none absolute right-5 top-5 h-8 w-8 text-[#7C7CFF]/60" />
              <div className="flex items-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00E5FF]/60 to-[#2DD4BF]/60 blur-sm opacity-70" />
                  <Image
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                    alt="James Wilson"
                    width={50}
                    height={50}
                    className="relative rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-slate-50">James Wilson</h4>
                  <p className="text-gray-400">Senior Pet Owner</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                "As my dog ages, VetLink&apos;s senior care features have been invaluable. The medication reminders
                and health alerts help me provide the best care for my 12-year-old companion."
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

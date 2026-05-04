"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Quote, User } from "lucide-react";

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-teal-500 to-cyan-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-slate-600 to-slate-800",
  "from-cyan-600 to-blue-700",
] as const;

function TestimonialAvatar({ avatarId }: { avatarId: number }) {
  const gradient = AVATAR_GRADIENTS[avatarId % AVATAR_GRADIENTS.length];
  return (
    <div className="relative shrink-0">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-100 to-teal-100 blur-sm opacity-70" />
      <div
        className={`relative flex h-[50px] w-[50px] items-center justify-center rounded-full bg-gradient-to-br ${gradient} ring-2 ring-gray-200/60`}
        aria-hidden
      >
        <User className="h-[22px] w-[22px] text-white" strokeWidth={2} />
      </div>
    </div>
  );
}

export default function Testimonials() {
  const testimonials = [
    {
      name: "Subodhi Nissanka",
      role: "Pet Owner",
      avatarId: 0,
      content:
        "VetLink's skin detection feature helped me catch my dog's early-stage dermatitis. The AI recommendations were spot-on and saved us a costly vet visit!",
    },
    {
      name: "Shehan Sugathapala",
      role: "Pet Owner",
      avatarId: 1,
      content:
        "The anomaly detection system alerted me when my cat started limping. Early detection meant faster treatment and a quicker recovery.",
    },
    {
      name: "Uditha Numwan",
      role: "Pet Owner",
      avatarId: 2,
      content:
        "The AI diet plans have been a game-changer for my pets' health. Each of my three pets has a personalized nutrition plan that works perfectly!",
    },
    {
      name: "Chathuranga Bandara",
      role: "Pet Owner",
      avatarId: 3,
      content:
        "The health monitoring dashboard gives me peace of mind. I can track my dog's activity levels, sleep patterns, and overall wellness trends all in one place.",
    },
    {
      name: "Anupama Maheepala",
      role: "Pet Owner",
      avatarId: 4,
      content:
        "VetLink's grooming recommendations are fantastic! My Persian cat's coat has never looked better. The AI suggested the perfect grooming schedule and products.",
    },
    {
      name: "Oshadha Dahanayaka",
      role: "Pet Owner",
      avatarId: 5,
      content:
        "As my dog ages, VetLink's senior care features have been invaluable. The medication reminders and health alerts help me provide the best care for my 12-year-old companion.",
    },
    {
      name: "Aloka Rathnayaka",
      role: "Pet Owner",
      avatarId: 6,
      content:
        "The pharmacy matching system is incredible! It found the exact medication my dog needed at a nearby pharmacy, saving me hours of searching.",
    },
    {
      name: "Vanuja Fernando",
      role: "Pet Owner",
      avatarId: 7,
      content:
        "I love how VetLink learns from my cat's behavior patterns. The predictive alerts have helped me catch issues before they become serious problems.",
    },
    {
      name: "Vihanga Denetha",
      role: "Pet Owner",
      avatarId: 8,
      content:
        "Managing health records for three pets used to be overwhelming. VetLink makes it so easy with its intuitive dashboard and AI-powered insights.",
    },
    {
      name: "Dr. Janaka Kumara",
      role: "Veterinarian",
      avatarId: 9,
      content:
        "The tele-vet consultation feature is a lifesaver! I can get professional advice instantly without leaving home, especially helpful for my anxious dog.",
    },
    {
      name: "Dr. Dilushan Rajapaksha",
      role: "Veterinarian",
      avatarId: 10,
      content:
        "VetLink's AI diet recommendations transformed my cat's health. The personalized meal plans based on breed and age are spot-on and easy to follow.",
    },
  ];

  // Each person appears in exactly one column (round-robin); duplicate only within that column for seamless infinite scroll
  const column1 = [0, 3, 6, 9].map((i) => testimonials[i]);
  const column2 = [1, 4, 7, 10].map((i) => testimonials[i]);
  const column3 = [2, 5, 8].map((i) => testimonials[i]);

  const duplicatedCol1 = [...column1, ...column1];
  const duplicatedCol2 = [...column2, ...column2];
  const duplicatedCol3 = [...column3, ...column3];

  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  return (
    <section
      id="testimonials"
      lang="en"
      className="relative overflow-hidden py-24 sm:py-32 bg-white font-sans"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-transparent blur-3xl"
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
        <motion.div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-teal-100/20 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
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
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            What{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              People Say
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Pet owners and veterinarians share how VetLink supports animal
            health
          </p>
        </motion.div>

        {/* Continuous Scrolling Container */}
        <div className="relative overflow-hidden">
          {/* Mask gradients for fade effect */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

          {/* Scrolling testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Column 1 */}
            <div
              className="relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col1")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col1" ? "paused" : ""
                }`}
              >
                {duplicatedCol1.map((testimonial, index) => (
                  <div
                    key={`col1-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <TestimonialAvatar avatarId={testimonial.avatarId} />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div
              className="relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col2")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col2" ? "paused" : ""
                }`}
                style={{
                  animationDelay: "20s",
                }}
              >
                {duplicatedCol2.map((testimonial, index) => (
                  <div
                    key={`col2-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <TestimonialAvatar avatarId={testimonial.avatarId} />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 (only on lg screens) */}
            <div
              className="hidden lg:block relative overflow-hidden h-[600px] sm:h-[650px] lg:h-[700px]"
              onMouseEnter={() => setHoveredColumn("col3")}
              onMouseLeave={() => setHoveredColumn(null)}
            >
              <div
                className={`testimonial-scroll space-y-6 lg:space-y-8 ${
                  hoveredColumn === "col3" ? "paused" : ""
                }`}
                style={{
                  animationDelay: "40s",
                }}
              >
                {duplicatedCol3.map((testimonial, index) => (
                  <div
                    key={`col3-${index}`}
                    className="group relative rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6 sm:p-7 transition-all hover:border-indigo-200/60 hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <Quote className="pointer-events-none absolute right-6 top-6 h-10 w-10 text-indigo-100" />

                    <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      <p className="text-gray-700 italic leading-relaxed mb-6 text-sm sm:text-base">
                        &quot;{testimonial.content}&quot;
                      </p>

                      <div className="flex items-center gap-4">
                        <TestimonialAvatar avatarId={testimonial.avatarId} />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

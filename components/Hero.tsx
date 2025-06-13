"use client"

import { motion } from "framer-motion"
import EmailForm from "./EmailForm"

export default function Hero() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <motion.div variants={staggerChildren} initial="initial" animate="animate" className="space-y-8">
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Two AI minds.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              One perfect response.
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Stop copy-pasting between ChatGPT and Claude. Watch them collaborate in real-time to give you the best
            possible answer.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-8" id="early-access">
            <EmailForm />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import { motion } from "framer-motion"
import { Brain } from "lucide-react"
import CallToAction from "./CallToAction"

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
    <section className="pt-64 pb-20 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <motion.div variants={staggerChildren} initial="initial" animate="animate" className="space-y-8">
          <motion.div variants={fadeInUp} className="space-y-2">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-on-dark leading-tight">
              Two AI minds.
              <sup className="ml-2 relative inline-block">
                <div className="relative w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                  {/* First brain - ChatGPT */}
                  <motion.div
                    className="absolute"
                    animate={{
                      rotateY: [0, 360],
                      x: [0, 8, 0, -8, 0],
                      z: [0, 4, 0, -4, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <Brain className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-primary drop-shadow-lg" />
                  </motion.div>
                  
                  {/* Second brain - Claude */}
                  <motion.div
                    className="absolute"
                    animate={{
                      rotateY: [180, 540],
                      x: [0, -8, 0, 8, 0],
                      z: [0, -4, 0, 4, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2, // Offset by half the duration
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <Brain className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-care drop-shadow-lg" />
                  </motion.div>
                </div>
              </sup>
            </h1>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary to-care bg-clip-text text-transparent">
                One perfect response.
              </span>
            </h1>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-on-dark max-w-3xl mx-auto leading-relaxed">
            Two AI minds, better answers for everything. Watch them collaborate in real-time to give you the best
            possible answer.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-8" id="early-access">
            <CallToAction />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

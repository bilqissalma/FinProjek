"use client"

import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1], // ✅ FIX (BUKAN STRING)
    },
  },
}

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.4,
      ease: [0.4, 0, 0.2, 1], // ✅ FIX
    },
  },
}

export default function HeroSection() {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left content */}
          <motion.div className="space-y-8" variants={containerVariants}>
            <motion.div className="space-y-4" variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance text-foreground">
                Pantau Progres Pembangunan Anda Secara Real-Time dan Transparan
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
                FinProjek membantu kontraktor melaporkan progres pembangunan dengan cepat, dan memudahkan pemilik
                bangunan memantau perkembangan proyek secara visual dan terstruktur.
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base font-semibold rounded-full"
              >
                Masuk ke Dashboard
              </Button>
            </motion.div>
          </motion.div>

          {/* Right illustration */}
          <motion.div
            className="relative h-96 sm:h-[500px] lg:h-[600px]"
            variants={imageVariants}
          >
            <div className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden">
              <img
                src="/images/kontraktor2.webp"
                alt="Dashboard Illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

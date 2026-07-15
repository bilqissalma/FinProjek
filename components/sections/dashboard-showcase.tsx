"use client"

import { motion } from "framer-motion"

export default function DashboardShowcase() {
  return (
    <section id="dashboard" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-primary/20 
        to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Dashboard yang Intuitif dan Powerful
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lihat perkembangan proyek Anda dalam satu dashboard yang komprehensif
          </p>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
<div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10
 rounded-3xl border border-foreground/10 overflow-hidden h-96 sm:h-[500px] lg:h-[600px] 
 lex items-center justify-center backdrop-blur-sm">
  
  {/* Background image replacing mockup preview */}
  <div className="absolute inset-0">
    <img
      src="/images/mockup.png"
      alt="Dashboard Mockup"
      className="w-full h-full object-cover"
    />
  </div>
  
</div>


          {/* Floating cards for effect */}
          <motion.div
            className="absolute top-4 left-4 w-32 h-24 bg-card rounded-xl border border-foreground/10 p-4 hidden lg:block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="text-xs font-semibold text-primary">Status Update</div>
            <div className="text-2xl font-bold text-foreground mt-2">85%</div>
          </motion.div>

          <motion.div
            className="absolute bottom-4 right-4 w-32 h-20 bg-card rounded-xl border border-foreground/10 p-4 hidden lg:block"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
          >
            <div className="text-xs font-semibold text-accent">Progres Minggu</div>
            <div className="text-xl font-bold text-foreground mt-2">+15%</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

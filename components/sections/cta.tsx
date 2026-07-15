"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient
        -to-bl from-primary/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr 
        from-accent/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-balance">
              Buat Monitoring Proyek Lebih Mudah dan Transparan
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Mulai gunakan FinProjek hari ini dan rasakan perbedaan dalam mengelola proyek konstruksi Anda.
            </p>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 
              px-10 py-7 text-lg font-semibold rounded-full"
            >
              Daftar Sekarang
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-10 py-7 text-lg font-semibold rounded-full 
              border-foreground/20 hover:bg-foreground/5 bg-transparent"
            >
              Kontak Tim Kami
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

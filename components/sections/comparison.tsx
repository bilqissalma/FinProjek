"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { Check, X } from "lucide-react"

export default function ComparisonSection() {
  const [isToggle, setIsToggle] = useState(false)

  const comparisonItems = [
    {
      item: "Pengiriman Dokumentasi",
      before: "Via chat / WhatsApp - berantakan",
      after: "Upload terstruktur di platform",
    },
    {
      item: "Pencarian Dokumen Lama",
      before: "Sulit menemukan & scroll panjang",
      after: "Galeri progres otomatis & searchable",
    },
    {
      item: "Timeline Proyek",
      before: "Tidak ada timeline yang jelas",
      after: "Timeline real-time visual",
    },
    {
      item: "Monitoring Jarak Jauh",
      before: "Harus pergi ke lokasi",
      after: "Bisa dipantau kapan saja online",
    },
    {
      item: "Laporan Progres",
      before: "Manual & memakan waktu",
      after: "Auto-generated harian/mingguan",
    },
    {
      item: "Transparansi & Komunikasi",
      before: "Miscommunication sering terjadi",
      after: "Clear & documented updates",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-l 
        from-secondary/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Sebelum vs Sesudah FinProjek
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transformasi cara Anda mengelola proyek pembangunan
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
            <button
              onClick={() => setIsToggle(false)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                !isToggle ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/10"
              }`}
            >
              Sebelum (Manual)
            </button>
            <button
              onClick={() => setIsToggle(true)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                isToggle ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-foreground/10"
              }`}
            >
              Sesudah (FinProjek)
            </button>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {comparisonItems.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="p-6 h-full border-foreground/10 bg-card/50 backdrop-blur-sm">
                <h4 className="font-semibold text-foreground mb-4">{item.item}</h4>

                {!isToggle ? (
                  <div className="flex gap-3 items-start">
                    <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.before}</p>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.after}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

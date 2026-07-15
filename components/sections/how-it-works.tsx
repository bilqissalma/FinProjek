"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Upload, Database, Eye } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Kontraktor Mengunggah Progres",
      description: "Foto, video, deskripsi, dan persentase perkembangan pekerjaan.",
      icon: Upload,
    },
    {
      number: "02",
      title: "Data Tersimpan Otomatis & Terstruktur",
      description: "Sistem merapikan update per-hari, per-pekerjaan, dan per-lokasi.",
      icon: Database,
    },
    {
      number: "03",
      title: "Pemilik Melihat Perkembangan Real-Time",
      description: "Dashboard dengan timeline progres dan galeri dokumentasi.",
      icon: Eye,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  }

  return (
    <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Bagaimana FinProjek Bekerja?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tiga langkah sederhana untuk transparansi proyek yang lebih baik
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full p-8 lg:p-6 hover:shadow-lg transition-all duration-300 
                hover:scale-105 cursor-pointer border-foreground/10 bg-card/50 backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                    bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                      <Icon className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary/70">{step.number}</p>
                      <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

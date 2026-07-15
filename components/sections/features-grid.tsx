"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ImageIcon, BarChart3, Clock, Archive, FileText, Bell } from "lucide-react"

export default function FeaturesGrid() {
  const features = [
    {
      icon: ImageIcon,
      title: "Upload Foto & Video Progres",
      description: "Dokumentasi visual lengkap dengan kualitas tinggi",
    },
    {
      icon: BarChart3,
      title: "Deskripsi & Persentase Pekerjaan",
      description: "Lacak kemajuan pekerjaan dengan detail akurat",
    },
    {
      icon: Clock,
      title: "Timeline Proyek Interaktif",
      description: "Lihat setiap tahap proyek dalam format timeline",
    },
    {
      icon: Archive,
      title: "Arsip Dokumentasi Otomatis",
      description: "Semua dokumen tersimpan rapi dan mudah diakses",
    },
    {
      icon: FileText,
      title: "Laporan Progres Harian/Mingguan",
      description: "Generate laporan otomatis sesuai kebutuhan",
    },
    {
      icon: Bell,
      title: "Notifikasi Update untuk Pemilik",
      description: "Dapatkan notifikasi real-time setiap update",
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
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent/20 to-secondary/10 rounded-full blur-3xl" />
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
            Fitur yang Mempermudah Monitoring Proyek Anda
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lengkap dengan semua yang Anda butuhkan untuk transparansi maksimal
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 h-full border-foreground/10 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group cursor-pointer">
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 text-primary group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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

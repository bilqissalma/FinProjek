"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TestimonialCarousel() {
  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Kontraktor Profesional",
      company: "PT Konstruksi Modern",
      content:
        "FinProjek mengubah cara saya berkomunikasi dengan klien. Update menjadi lebih cepat dan transparan. Klien saya sangat puas!",
      avatar: "👨‍💼",
    },
    {
      name: "Siti Nurhaliza",
      role: "Pemilik Proyek",
      company: "PT Properti Investasi",
      content:
        "Saya bisa memantau proyek dari rumah dengan detail yang jelas. Tidak perlu khawatir lagi tentang keterlambatan atau penyimpangan.",
      avatar: "👩‍💼",
    },
    {
      name: "Ahmad Wijaya",
      role: "Pengawas Lapangan",
      company: "CV Teknik Bangunan",
      content:
        "Dokumentasi menjadi sistematis dan mudah dicari. Laporan progres yang dulunya ribet, sekarang bisa dibuat dalam hitungan menit.",
      avatar: "👨‍🔧",
    },
  ]

  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrent((prev) => (prev + newDirection + testimonials.length) % testimonials.length)
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Apa Kata Mereka?
          </h2>
          <p className="text-lg text-muted-foreground">Pengalaman nyata dari pengguna FinProjek</p>
        </motion.div>

        <div className="relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
              }}
              className="w-full"
            >
              <Card className="p-8 sm:p-12 text-center border-foreground/10 bg-card/50 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="text-6xl">{testimonials[current].avatar}</div>
                  <p className="text-xl sm:text-2xl text-foreground leading-relaxed italic">
                    "{testimonials[current].content}"
                  </p>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground">{testimonials[current].name}</h4>
                    <p className="text-muted-foreground">{testimonials[current].role}</p>
                    <p className="text-sm text-muted-foreground/70">{testimonials[current].company}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="icon"
              variant="outline"
              onClick={() => paginate(-1)}
              className="rounded-full border-foreground/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => paginate(1)}
              className="rounded-full border-foreground/20"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > current ? 1 : -1)
                  setCurrent(index)
                }}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "bg-primary w-8" : "bg-muted-foreground/30 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

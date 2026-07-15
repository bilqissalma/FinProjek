"use client"

import { motion } from "framer-motion"

export default function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-foreground/5 backdrop-blur-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo section */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">FinProjek</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Platform monitoring progres pembangunan yang menghubungkan kontraktor dan pemilik bangunan.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Fitur</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Timeline Progres
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Dokumentasi
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Cara Kerja</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Untuk Kontraktor
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Untuk Pemilik
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Panduan
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Kontak</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:info@finprojek.com" className="hover:text-foreground transition-colors">
                    info@finprojek.com
                  </a>
                </li>
                <li>
                  <a href="tel:+62212345678" className="hover:text-foreground transition-colors">
                    +62 (21) 2345-678
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Bottom section */}
          <motion.div
            className="pt-8 border-t border-foreground/10 flex flex-col sm:flex-row 
            ustify-between items-center gap-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p>&copy; 2025 FinProjek. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}

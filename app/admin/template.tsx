"use client"
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TemplateProps {
  children: ReactNode
}

export default function AdminTemplate({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  )
}

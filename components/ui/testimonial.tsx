"use client"

import React from "react"
import Image from "next/image"

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export function TestimonialCard({ testimonial, delay = "" }: { testimonial: Testimonial, delay?: string }) {
  return (
    <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
      <Image height={40} width={40} src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
        <p className="text-muted-foreground">{testimonial.handle}</p>
        <p className="mt-1 text-foreground/80">{testimonial.text}</p>
      </div>
    </div>
  )
}

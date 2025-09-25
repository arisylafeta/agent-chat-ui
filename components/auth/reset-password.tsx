"use client"

import React, { useActionState } from 'react'
import Link from 'next/link'
import GlassInputWrapper from '@/components/ui/glass-input-wrapper'
import { Testimonial, TestimonialCard } from '@/components/ui/testimonial'
import { testimonials as sharedTestimonials } from '@/data/testimonials'
import { requestPasswordReset } from '@/app/(auth)/actions'

interface ResetPasswordProps {
  title?: React.ReactNode
  description?: React.ReactNode
  heroImageSrc?: string
}

export default function ResetPasswordForm({
  title = <span className="font-light text-foreground tracking-tighter">Reset password</span>,
  description = "Enter your email and we'll send you a reset link",
  heroImageSrc = '',
}: ResetPasswordProps) {
  type ResetState = { message: string; ok?: boolean }
  const [state, formAction] = useActionState<ResetState, FormData>(
    requestPasswordReset,
    { message: '' }
  )

  const testimonials: Testimonial[] = sharedTestimonials.slice(0, 1).map((t) => ({
    avatarSrc: t.avatar,
    name: t.name,
    handle: t.role,
    text: t.content,
  }))

  return (
    <div className="h-dvh flex flex-col md:flex-row font-geist w-dvw">
      {/* Left column: reset form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" action={formAction}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-hidden"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <button
                type="submit"
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Send reset link
              </button>
              {state?.message && (
                <p
                  className={`text-sm text-center ${state.ok ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {state.message}
                </p>
              )}
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Remembered your password?</span>
            </div>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              Go back to{' '}
              <Link href="/login" className="text-violet-400 hover:underline transition-colors">
                Sign In
              </Link>
              {' '}or{' '}
              <Link href="/signup" className="text-violet-400 hover:underline transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

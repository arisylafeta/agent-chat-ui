import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../utils/supabase/server'

// Handles OAuth provider redirects (e.g., Google) and password recovery links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/'
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // If the provider sent an error, bounce to an error page
  if (error) {
    redirect(`/error?message=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      // Successfully set auth cookies, send the user on their way
      redirect(next)
    }
  }

  // Fallback if no code or exchange failed
  redirect('/login')
}

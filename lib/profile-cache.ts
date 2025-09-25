export type UserProfile = {
  name: string
  email: string
  avatar?: string
}

const STORAGE_KEY = "reoutfit_profile_cache_v1"
const TTL_MS = 5 * 60 * 1000 // 5 minutes

let memCache: { profile: UserProfile | null; expiry: number } | null = null

function now() {
  return Date.now()
}

function readLocal(): { profile: UserProfile | null; expiry: number } | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { profile: UserProfile | null; expiry: number }
    if (!parsed || typeof parsed.expiry !== "number") return null
    if (parsed.expiry <= now()) {
      // expired
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeLocal(profile: UserProfile | null) {
  try {
    const payload = { profile, expiry: now() + TTL_MS }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  } catch {
    // ignore
  }
}

function computeProfileFromUser(user: any): UserProfile | null {
  if (!user) return null
  const name =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    user.email?.split("@")[0] ||
    "User"
  const email = user.email || ""
  const avatar =
    (user.user_metadata as any)?.avatar_url ||
    (user.user_metadata as any)?.picture ||
    undefined
  return { name, email, avatar }
}

export async function getProfileCached(
  supabase: any,
  opts?: { forceRefresh?: boolean }
): Promise<UserProfile | null> {
  const forceRefresh = opts?.forceRefresh === true

  if (!forceRefresh) {
    if (memCache && memCache.expiry > now()) {
      return memCache.profile
    }
    const local = readLocal()
    if (local) {
      memCache = local
      return local.profile
    }
  }

  // Fetch fresh from Supabase (this usually reads local session, minimal network)
  const { data } = await supabase.auth.getUser()
  const profile = computeProfileFromUser(data?.user)

  memCache = { profile, expiry: now() + TTL_MS }
  writeLocal(profile)

  return profile
}

export function clearProfileCache() {
  memCache = null
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

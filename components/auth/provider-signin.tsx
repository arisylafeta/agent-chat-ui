"use client"
import { signInWithGoogle } from '@/app/(auth)/actions'
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function ProviderSigninBlock() {
    return (
        <>
            <div className="flex flex-row gap-2">
                <form action={signInWithGoogle} className="basis-full">
                    <Button variant="outline" aria-label="Sign in with Google" type="submit" className="w-full py-6">
                        <Image src="/google.svg" alt="Google" width={24} height={24} />
                        Sign in with Google
                    </Button>
                </form>
            </div>
        </>
    )
}   
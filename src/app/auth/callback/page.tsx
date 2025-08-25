"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackInner(){
	const router = useRouter()
	const searchParams = useSearchParams()

	useEffect(() => {
		supabase.auth.getSession().then(() => {
			const next = searchParams.get('next')
			if (next) {
				router.replace(next)
			} else {
				router.replace('/')
			}
		})
	}, [router, searchParams])

	return (
		<div className="max-w-md mx-auto px-4 py-12 text-center text-gray-600">Completing sign-in…</div>
	)
}

export default function AuthCallbackPage(){
	return (
		<Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-center text-gray-600">Preparing…</div>}>
			<CallbackInner />
		</Suspense>
	)
}

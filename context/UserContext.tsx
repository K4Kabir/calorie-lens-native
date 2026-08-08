import { useUser } from '@clerk/expo'
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import type { OnboardingData } from '@/components/Onboarding/OnboardingScreen'
import {
    checkUser,
    deleteMeal,
    saveUserOnboarding,
    updateUserMetrics,
    type MetricsOut,
    type MetricsUpdateInput,
    type UserOut,
} from '@/utils/api'

type UserContextValue = {
    /** The backend user returned by POST /users/check (null until fetched). */
    user: UserOut | null
    /** The user's single metrics row; null until onboarding is completed. */
    metric: MetricsOut | null
    /** True while the app is still determining the user's onboarding state. */
    isCheckingUser: boolean
    /** Derived from `metric`: false until the user has completed onboarding. */
    isOnboardingDone: boolean
    /** Re-fetch the user (and their metric) from the backend. */
    refreshUser: () => Promise<void>
    /** Save onboarding answers (AI computes calorie target) and update context. */
    completeOnboarding: (data: OnboardingData) => Promise<MetricsOut>
    /** Save updated metrics (AI recomputes calorie target) and update context. */
    updateMetrics: (input: MetricsUpdateInput) => Promise<MetricsOut>
    /** Delete a meal from the backend and remove it from the context. */
    removeMeal: (mealId: number) => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

function requireClerkId(clerkId: string | undefined): string {
    if (!clerkId) {
        throw new Error('You must be signed in to perform this action')
    }
    return clerkId
}


export function UserProvider({ children }: { children: ReactNode }) {
    const { isLoaded, user: clerkUser } = useUser()
    const [user, setUser] = useState<UserOut | null>(null)
    const [isCheckingUser, setIsCheckingUser] = useState(true)


    const refreshUser = useCallback(async () => {
        if (!clerkUser?.id) {
            setIsCheckingUser(false)
            return
        }
        try {
            const result = await checkUser({
                name:
                    clerkUser.fullName ??
                    clerkUser.primaryEmailAddress?.emailAddress ??
                    '',
                username: clerkUser.username ?? `user_${clerkUser.id}`,
                email:
                    clerkUser.primaryEmailAddress?.emailAddress ??
                    clerkUser.emailAddresses?.[0]?.emailAddress ??
                    '',
                clerk_id: clerkUser.id,
            })
            setUser(result)
        } catch (error) {
            console.error('Failed to check user:', error)
        } finally {
            setIsCheckingUser(false)
        }
    }, [clerkUser])

    // Fetch the user as soon as Clerk has loaded the signed-in user.
    useEffect(() => {
        if (!isLoaded) return
        refreshUser()
    }, [isLoaded, refreshUser])

    const completeOnboarding = useCallback(
        async (data: OnboardingData) => {
            const clerkId = requireClerkId(clerkUser?.id)
            const metrics = await saveUserOnboarding(data, clerkId)
            // Complete onboarding from the saved row immediately, even if the
            // follow-up refetch below fails (e.g. a network blip) — otherwise
            // the user would be stuck on the onboarding screen.
            setUser((prev) => {
                if (prev) return { ...prev, metric: metrics }
                return {
                    id: -1,
                    name:
                        clerkUser?.fullName ??
                        clerkUser?.primaryEmailAddress?.emailAddress ??
                        '',
                    username: clerkUser?.username ?? `user_${clerkId}`,
                    email: clerkUser?.primaryEmailAddress?.emailAddress ?? '',
                    clerk_id: clerkId,
                    meals: [],
                    metric: metrics,
                }
            })
            // Re-pull the full user (real id, meals) from the backend.
            await refreshUser()
            return metrics
        },
        [clerkUser, refreshUser]
    )

    const updateMetrics = useCallback(
        async (input: MetricsUpdateInput) => {
            const clerkId = requireClerkId(clerkUser?.id)
            const metrics = await updateUserMetrics(input, clerkId)
            setUser((prev) => (prev ? { ...prev, metric: metrics } : prev))
            return metrics
        },
        [clerkUser]
    )

    const removeMeal = useCallback(
        async (mealId: number) => {
            try {
                await deleteMeal(mealId)
                // Remove the meal from the context so every screen (home,
                // details) stays in sync with the backend.
                setUser((prev) =>
                    prev
                        ? { ...prev, meals: prev.meals.filter((meal) => meal.id !== mealId) }
                        : prev
                )
            } catch (error) {
                // Restore the list from the backend so the UI reflects reality.
                await refreshUser()
                throw error
            }
        },
        [refreshUser]
    )

    const metric = user?.metric ?? null

    const value = useMemo<UserContextValue>(
        () => ({
            user,
            metric,
            isCheckingUser,
            isOnboardingDone: Boolean(metric),
            refreshUser,
            completeOnboarding,
            updateMetrics,
            removeMeal,
        }),
        [user, metric, isCheckingUser, refreshUser, completeOnboarding, updateMetrics, removeMeal]
    )

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext(): UserContextValue {
    const ctx = useContext(UserContext)
    if (!ctx) {
        throw new Error('useUserContext must be used within a UserProvider')
    }
    return ctx
}

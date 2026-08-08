import LoadingScreen from '@/components/LoadingScreen'
import OnboardingScreen from '@/components/Onboarding/OnboardingScreen'
import { UserProvider, useUserContext } from '@/context/UserContext'
import { Stack } from 'expo-router'
import React, { useState } from 'react'

function RootNavigator() {
    const { isCheckingUser, isOnboardingDone, completeOnboarding } = useUserContext()
    const [onboardingError, setOnboardingError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    // While we determine whether this user has already completed onboarding,
    // stay on the loading screen instead of flashing a blank screen or the
    // onboarding flow before the check-user request has finished.
    if (isCheckingUser) return <LoadingScreen message="Loading your meals…" />

    if (!isOnboardingDone) {
        return (
            <OnboardingScreen
                loading={loading}
                error={onboardingError}
                onComplete={async (data) => {
                    setOnboardingError(null)
                    setLoading(true)
                    try {
                        const metrics = await completeOnboarding(data)
                    } catch (error) {
                        console.error('Failed to save onboarding:', error)
                        setOnboardingError(
                            'Could not save your details right now. Please try again.'
                        )
                    } finally {
                        setLoading(false)
                    }
                }}
            />
        )
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="food-details" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="meal-details" options={{ animation: 'slide_from_right' }} />
        </Stack>
    )
}

export default function RootLayout() {
    return (
        <UserProvider>
            <RootNavigator />
        </UserProvider>
    )
}

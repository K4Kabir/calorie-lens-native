import { useAuth } from '@clerk/expo'
import LoadingScreen from '@/components/LoadingScreen'
import { Redirect, Stack } from 'expo-router'
import React from 'react'

export default function AuthLayout() {
    const { isLoaded, isSignedIn } = useAuth()

    if (!isLoaded) {
        return <LoadingScreen />
    }

    if (isSignedIn) {
        return <Redirect href="/(root)/(tabs)" />
    }
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }} />
    )
}
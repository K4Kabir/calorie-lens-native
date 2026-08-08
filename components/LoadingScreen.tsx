import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

type LoadingScreenProps = {
    /** Short caption shown under the spinner. */
    message?: string
}

/**
 * Branded full-screen loader shown while the app is starting up —
 * while Clerk loads, and while the backend checks whether the user
 * exists (replaces the previous blank screens).
 */
export default function LoadingScreen({
    message = 'Loading…',
}: LoadingScreenProps) {
    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top', 'bottom']}>
            {/* soft decorative blobs, matching AuthShell */}
            <View className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-[#E7F2E9]" />
            <View className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#F5F0E3]" />

            <View className="flex-1 items-center justify-center">
                <Animated.View entering={FadeInDown.duration(350)} className="items-center">
                    <View
                        className="h-16 w-16 items-center justify-center rounded-3xl bg-[#E7F2E9]"
                        style={{
                            shadowColor: '#2F7A3E',
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 4,
                        }}
                    >
                        <Ionicons name="nutrition" size={30} color="#4E9F5A" />
                    </View>
                    <ActivityIndicator size="large" color="#4E9F5A" className="mt-7" />
                    <Text className="mt-4 text-sm text-gray-500">{message}</Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    )
}

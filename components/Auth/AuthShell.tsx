import { Ionicons } from '@expo/vector-icons'
import React, { type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

type AuthShellProps = {
    /** Big headline at the top of the screen. */
    title: string
    /** One-line description under the headline. */
    subtitle?: string
    /** Form content rendered inside the white card. */
    children: ReactNode
    /** Optional row rendered under the card (e.g. the switch-to-other-auth link). */
    footer?: ReactNode
    /** Ionicons glyph shown in the brand badge. */
    badgeIcon?: keyof typeof Ionicons.glyphMap
}

/**
 * Shared visual shell for the authentication screens (sign-in, sign-up and
 * their verification states). Matches the warm `#F5F4F0` background, green
 * accents and white rounded-card language used across Home and History.
 */
export default function AuthShell({
    title,
    subtitle,
    children,
    footer,
    badgeIcon = 'nutrition',
}: AuthShellProps) {
    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top', 'bottom']}>
            {/* soft decorative blobs */}
            <View className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-[#E7F2E9]" />
            <View className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#F5F0E3]" />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingVertical: 32,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View entering={FadeInDown.duration(350)}>
                        {/* Brand mark + heading */}
                        <View className="items-center">
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
                                <Ionicons name={badgeIcon} size={30} color="#4E9F5A" />
                            </View>
                            <Text className="mt-5 text-2xl font-bold text-gray-900">{title}</Text>
                            {subtitle ? (
                                <Text className="mt-2 max-w-[300px] text-center text-sm leading-5 text-gray-500">
                                    {subtitle}
                                </Text>
                            ) : null}
                        </View>

                        {/* Form card */}
                        <View
                            className="mt-7 rounded-3xl bg-white p-5"
                            style={{
                                shadowColor: '#000000',
                                shadowOpacity: 0.06,
                                shadowRadius: 16,
                                shadowOffset: { width: 0, height: 6 },
                                elevation: 3,
                            }}
                        >
                            {children}
                        </View>

                        {footer ? <View className="mt-6 items-center">{footer}</View> : null}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

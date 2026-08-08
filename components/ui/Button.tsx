import { Feather } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost'

type ButtonProps = {
    title: string
    onPress?: () => void
    disabled?: boolean
    loading?: boolean
    variant?: ButtonVariant
    /** Feather icon name rendered before the title. */
    icon?: keyof typeof Feather.glyphMap
    /** Extra classes applied to the button container (e.g. mt-8, px-8). */
    className?: string
}

const VARIANT_STYLES: Record<ButtonVariant, { container: string; text: string; icon: string }> = {
    primary: {
        container: 'bg-[#4E9F5A] active:opacity-80',
        text: 'text-white',
        icon: '#FFFFFF',
    },
    outline: {
        container: 'border border-[#4E9F5A] bg-white active:opacity-80',
        text: 'text-[#2F7A3E]',
        icon: '#2F7A3E',
    },
    danger: {
        container: 'border border-red-200 bg-white active:opacity-70',
        text: 'text-red-600',
        icon: '#DC2626',
    },
    ghost: {
        container: 'active:opacity-70',
        text: 'text-[#2F7A3E]',
        icon: '#2F7A3E',
    },
}

export default function Button({
    title,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    icon,
    className,
}: ButtonProps) {
    const isDisabled = disabled || loading
    const styles = VARIANT_STYLES[variant]

    const containerClasses = [
        'flex-row items-center justify-center gap-2 rounded-full py-4 px-6',
        styles.container,
        isDisabled ? (variant === 'primary' ? 'bg-gray-300' : 'opacity-50') : '',
        className,
    ].join(' ')

    return (
        <Pressable onPress={onPress} disabled={isDisabled} className={containerClasses}>
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : styles.icon} />
            ) : icon ? (
                <Feather name={icon} size={16} color={styles.icon} />
            ) : null}
            <Text
                className={`text-base font-bold ${
                    isDisabled && variant === 'primary' ? 'text-gray-500' : styles.text
                }`}
            >
                {title}
            </Text>
        </Pressable>
    )
}

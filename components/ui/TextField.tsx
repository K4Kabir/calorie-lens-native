import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native'

export type TextFieldProps = TextInputProps & {
    /** Small uppercase label rendered above the field. */
    label?: string
    /** Ionicons icon name rendered on the left side of the field. */
    icon?: keyof typeof Ionicons.glyphMap
    /** Suffix text rendered on the right side of the field (e.g. "kg", "yrs"). */
    suffix?: string
    /** Error message rendered below the field. */
    error?: string
    /** Classes applied to the outer wrapper (useful for spacing like mt-7). */
    className?: string
    /** Classes applied to the input row container. */
    containerClassName?: string
    /** Classes applied to the TextInput itself. */
    inputClassName?: string
}

export default function TextField({
    label,
    icon,
    suffix,
    error,
    className,
    containerClassName,
    inputClassName,
    secureTextEntry,
    ...inputProps
}: TextFieldProps) {
    const [visible, setVisible] = useState(false)
    const isSecure = !!secureTextEntry

    return (
        <View className={className}>
            {label ? (
                <Text className="mb-2 text-xs font-semibold tracking-wide text-gray-400">
                    {label.toUpperCase()}
                </Text>
            ) : null}
            <View
                className={`flex-row items-center rounded-2xl bg-white px-4 ${containerClassName ?? ''}`}
            >
                {icon ? <Ionicons name={icon} size={18} color="#9CA3AF" /> : null}
                <TextInput
                    placeholderTextColor="#C4C4C0"
                    style={{ textAlignVertical: 'center', includeFontPadding: false }}
                    className={`flex-1 py-4 text-base font-semibold text-gray-900 ${
                        icon ? 'ml-3' : ''
                    } ${isSecure ? 'pr-2' : ''} ${inputClassName ?? ''}`}
                    secureTextEntry={isSecure && !visible}
                    {...inputProps}
                />
                {isSecure ? (
                    <Pressable
                        onPress={() => setVisible((v) => !v)}
                        hitSlop={10}
                        className="ml-2 p-1.5 active:opacity-60"
                        accessibilityRole="button"
                        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                    >
                        <Ionicons
                            name={visible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#9CA3AF"
                        />
                    </Pressable>
                ) : suffix ? (
                    <Text className="ml-1.5 text-sm font-semibold text-gray-400">{suffix}</Text>
                ) : null}
            </View>
            {error ? <Text className="mt-1.5 text-xs text-red-600">{error}</Text> : null}
        </View>
    )
}

import React from 'react'
import { Text, View } from 'react-native'
import type { Macro } from './types'

export default function MacroBar({ label, current, goal, color, trackColor }: Macro) {
    const percent = goal > 0 ? Math.min(current / goal, 1) : 0

    return (
        <View className="flex-1">
            <Text className="text-xs text-gray-400">
                {label} <Text className="text-xs font-semibold text-gray-900">{current}</Text>/{goal}g
            </Text>
            <View className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: trackColor }}>
                <View
                    className="h-1.5 rounded-full"
                    style={{ width: `${percent * 100}%`, backgroundColor: color }}
                />
            </View>
        </View>
    )
}

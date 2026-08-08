import React from 'react';
import { Text, View } from 'react-native';

export default function Dot({ value, color }: { color: string; value: number }) {
    return (
        <View className="flex-row items-center gap-1">
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className="text-xs text-gray-400">{value}g</Text>
        </View>
    )
}
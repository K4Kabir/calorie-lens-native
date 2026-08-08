import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

type WeekSwitcherProps = {
  offset: number
  weekLabel: string
  rangeLabel: string
  onChange: (offset: number) => void
}

export default function WeekSwitcher({ offset, weekLabel, rangeLabel, onChange }: WeekSwitcherProps) {
  const go = (delta: number) => {
    const next = offset + delta
    if (next < 0) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(next)
  }

  return (
    <View
      className="mt-4 flex-row items-center rounded-2xl bg-white px-2 py-2"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <Pressable
        onPress={() => go(1)}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-xl active:bg-gray-100"
      >
        <Feather name="chevron-left" size={20} color="#4E9F5A" />
      </Pressable>

      <View className="flex-1 items-center">
        <Text className="text-sm font-bold text-gray-900">{weekLabel}</Text>
        <Text className="mt-0.5 text-[11px] font-medium text-gray-400">{rangeLabel}</Text>
      </View>

      <Pressable
        onPress={() => go(-1)}
        disabled={offset === 0}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-xl active:bg-gray-100"
      >
        <Feather name="chevron-right" size={20} color={offset === 0 ? '#D1D5DB' : '#4E9F5A'} />
      </Pressable>
    </View>
  )
}

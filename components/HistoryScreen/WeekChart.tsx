import { Feather } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import Svg, { Line } from 'react-native-svg'
import Dot from '@/components/HomeScreen/Dot'
import type { DaySummary } from './types'

const BAR_LAYER_HEIGHT = 148
const VALUE_LABEL_H = 20
const MAX_BAR_H = BAR_LAYER_HEIGHT - VALUE_LABEL_H - 4
const COL_GAP = 6

const MACRO_COLORS = { protein: '#E0685E', carbs: '#E0AA3E', fat: '#4E7FE0' }

type WeekChartProps = {
  days: DaySummary[]
  goal: number
  selectedIndex: number
  onSelect: (index: number) => void
}

export default function WeekChart({ days, goal, selectedIndex, onSelect }: WeekChartProps) {
  const [width, setWidth] = useState(0)

  // Scale so the tallest bar (or the goal line, whichever is higher) fits
  // comfortably with a little headroom. `1` guards against an all-zero week.
  const maxValue = Math.max(1, goal, ...days.map((d) => d.kcal)) * 1.12
  const colWidth = width > 0 ? (width - COL_GAP * 6) / 7 : 0
  const goalY = BAR_LAYER_HEIGHT - (goal / maxValue) * MAX_BAR_H
  const selected = days[selectedIndex]

  const barHeight = (kcal: number) =>
    kcal === 0 ? 5 : Math.max(6, (kcal / maxValue) * MAX_BAR_H)

  return (
    <View>
      {/* Bars + dashed goal line */}
      <View style={{ height: BAR_LAYER_HEIGHT }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && goal > 0 && (
          <Animated.View
            entering={FadeIn.delay(220).duration(400)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <Svg width={width} height={BAR_LAYER_HEIGHT}>
              <Line x1={0} y1={goalY} x2={width} y2={goalY} stroke="#E0AA3E" strokeWidth={2} strokeDasharray="6 4" />
            </Svg>
          </Animated.View>
        )}

        {width > 0 &&
          days.map((day, i) => {
            const h = barHeight(day.kcal)
            const isSelected = i === selectedIndex
            return (
              <Pressable
                key={day.dayLabel}
                onPress={() => onSelect(i)}
                style={{
                  position: 'absolute',
                  left: COL_GAP / 2 + i * (colWidth + COL_GAP),
                  width: colWidth,
                  height: BAR_LAYER_HEIGHT,
                }}
              >
                {day.kcal > 0 && (
                  <View
                    style={{ position: 'absolute', bottom: h + 5, left: 0, right: 0, alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isSelected ? '#2F7A3E' : '#9CA3AF',
                      }}
                    >
                      {day.kcal}
                    </Text>
                  </View>
                )}
                <Animated.View
                  entering={FadeInDown.delay(i * 45).duration(320)}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: h,
                    backgroundColor:
                      day.kcal === 0 ? '#E7E6E1' : isSelected ? '#2F7A3E' : '#4E9F5A',
                    borderTopLeftRadius: 7,
                    borderTopRightRadius: 7,
                  }}
                />
              </Pressable>
            )
          })}
      </View>

      {/* Day labels */}
      <View className="mt-1.5 flex-row">
        {days.map((day, i) => (
          <Pressable
            key={day.dayLabel}
            onPress={() => onSelect(i)}
            style={{ width: colWidth, marginRight: i === 6 ? 0 : COL_GAP }}
            className="items-center py-1"
          >
            <Text
              className={`text-[11px] font-semibold ${
                i === selectedIndex
                  ? 'text-[#2F7A3E]'
                  : day.isToday
                    ? 'text-[#4E9F5A]'
                    : 'text-gray-400'
              }`}
            >
              {day.dayLabel}
            </Text>
            <View className={`mt-1 h-1 w-1 rounded-full ${day.isToday ? 'bg-[#4E9F5A]' : 'bg-transparent'}`} />
          </Pressable>
        ))}
      </View>

      {/* Selected-day breakdown */}
      <View className="mt-3 rounded-2xl bg-[#F5F4F0] px-4 py-3">
        {selected.kcal > 0 ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold tracking-wide text-gray-400">
                {selected.fullLabel.toUpperCase()}
              </Text>
              <View className="mt-1.5 flex-row items-center gap-3">
                <Dot color={MACRO_COLORS.protein} value={selected.protein} />
                <Dot color={MACRO_COLORS.carbs} value={selected.carbs} />
                <Dot color={MACRO_COLORS.fat} value={selected.fat} />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-gray-900">{selected.kcal}</Text>
              <Text className="text-xs text-gray-400">
                kcal · {selected.mealCount} {selected.mealCount === 1 ? 'meal' : 'meals'}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-center gap-2 py-1">
            <Feather name="coffee" size={15} color="#9CA3AF" />
            <Text className="text-sm text-gray-400">No meals logged on this day</Text>
          </View>
        )}
      </View>
    </View>
  )
}

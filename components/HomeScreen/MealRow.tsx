import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useRef } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated'
import Dot from './Dot'
import type { Meal } from './types'

type MealRowProps = {
    meal: Meal
    onDelete?: (id: number) => void
}

function DeleteAction({ progress, onDelete }: { progress: SharedValue<number>; onDelete: () => void }) {
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.6], [0.4, 1], Extrapolation.CLAMP),
        transform: [
            { scale: interpolate(progress.value, [0, 0.6], [0.85, 1], Extrapolation.CLAMP) },
        ],
    }))

    return (
        <Pressable
            onPress={onDelete}
            className="ml-2 h-full w-[92px] items-center justify-center rounded-2xl bg-red-500 active:opacity-80"
        >
            <Animated.View style={animatedStyle} className="items-center">
                <Feather name="trash-2" size={20} color="#FFFFFF" />
                <Text className="mt-1 text-xs font-bold text-white">Delete</Text>
            </Animated.View>
        </Pressable>
    )
}

export default function MealRow({ meal, onDelete }: MealRowProps) {
    const router = useRouter()
    // True while a swipe gesture is in flight (or just happened), so the tap
    // that follows a swipe doesn't navigate to the details page.
    const isSwipingRef = useRef(false)
    // True when the row is currently swiped open, so a tap closes it instead of navigating.
    const isOpenRef = useRef(false)
    const swipeableRef = useRef<{ close: () => void } | null>(null)

    const handleRowPress = () => {
        // A swipe also triggers onPress on release — swallow that.
        if (isSwipingRef.current) {
            isSwipingRef.current = false
            return
        }
        // If the row is swiped open, tapping it closes the delete action.
        if (isOpenRef.current) {
            swipeableRef.current?.close()
            return
        }
        router.push({ pathname: '/meal-details', params: { id: meal.id } })
    }

    return (
        <ReanimatedSwipeable
            renderRightActions={(progress, _translation, swipeable) => {
                swipeableRef.current = swipeable
                return <DeleteAction progress={progress} onDelete={() => onDelete?.(meal.id)} />
            }}
            onSwipeableWillOpen={() => {
                isSwipingRef.current = true
            }}
            onSwipeableOpen={(direction) => {
                isOpenRef.current = true
                if (direction === 'right' && Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                }
            }}
            onSwipeableClose={() => {
                isOpenRef.current = false
            }}
            overshootRight={false}
            rightThreshold={24}
            friction={2}
        >
            <Pressable
                onPress={handleRowPress}
                onPressIn={() => {
                    // Clear any stale swipe flag before a brand-new press.
                    isSwipingRef.current = false
                }}
                className="flex-row items-center gap-3 rounded-2xl bg-white p-3 active:opacity-70"
            >
                <Image source={{ uri: meal.image ?? "" }} className="h-12 w-12 rounded-xl bg-gray-100" />
                <View className="flex-1">
                    <Text numberOfLines={1} className="text-[15px] font-semibold text-gray-900">
                        {meal.title}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-2">
                        <Text className="text-xs text-gray-400">{meal.time}</Text>
                        <Dot color="#E0685E" value={meal.protein} />
                        <Dot color="#E0AA3E" value={meal.carbs} />
                        <Dot color="#4E7FE0" value={meal.fat} />
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-[15px] font-bold text-gray-900">{meal.kcal}</Text>
                    <Text className="text-xs text-gray-400">kcal</Text>
                </View>
            </Pressable>
        </ReanimatedSwipeable>
    )
}

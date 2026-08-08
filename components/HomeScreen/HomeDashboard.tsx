import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react'
import {
    LayoutAnimation,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    UIManager,
    View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import MealRow from './MealRow'
import type { HomeDashboardProps } from './types'
import Button from '@/components/ui/Button'
import { useUserContext } from '@/context/UserContext'
import type { MealOut } from '@/utils/api'
import { getDailyMacroGoals } from '@/utils/macros'

const RING_SIZE = 148
const RING_STROKE = 14
const RADIUS = (RING_SIZE - RING_STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Macro colors reused across Home + History so the two screens feel like one app.
const MACRO_COLORS = {
    protein: { color: '#E0685E', track: '#F6E3E1' },
    carbs: { color: '#E0AA3E', track: '#F7EDD7' },
    fat: { color: '#4E7FE0', track: '#DDE6F8' },
}

/** True when the meal's `created_at` falls on the user's local calendar day. */
function isTodayMeal(meal: MealOut): boolean {
    const date = new Date(meal.created_at)
    return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString()
}

function CalorieRing({ eaten, goal, overGoal }: { eaten: number; goal: number; overGoal: boolean }) {
    const percent = goal > 0 ? Math.min(eaten / goal, 1) : 0
    const dashOffset = CIRCUMFERENCE * (1 - percent)
    const ringColor = overGoal ? '#E0AA3E' : '#4E9F5A'
    const remaining = Math.max(0, goal - eaten)

    return (
        <View style={{ width: RING_SIZE, height: RING_SIZE }} className="items-center justify-center">
            <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="#EDEEE9"
                    strokeWidth={RING_STROKE}
                    fill="none"
                />
                <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke={ringColor}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    rotation={-90}
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
            </Svg>
            <View className="absolute items-center">
                <Text className="text-3xl font-bold text-gray-900">{remaining.toLocaleString()}</Text>
                <Text className="mt-0.5 text-xs text-gray-400">{overGoal ? 'kcal over' : 'kcal left'}</Text>
            </View>
        </View>
    )
}

/** Compact per-macro progress bar for the hero card. */
function MacroProgress({
    label,
    current,
    goal,
    color,
    trackColor,
}: {
    label: string
    current: number
    goal: number
    color: string
    trackColor: string
}) {
    const percent = goal > 0 ? Math.min(current / goal, 1) : 0
    return (
        <View>
            <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-gray-400">{label}</Text>
                <Text className="text-[11px] font-semibold text-gray-900">
                    {current}
                    <Text className="font-normal text-gray-400"> / {goal}g</Text>
                </Text>
            </View>
            <View className="mt-1.5 h-1.5 rounded-full" style={{ backgroundColor: trackColor }}>
                <View
                    className="h-1.5 rounded-full"
                    style={{ width: `${percent * 100}%`, backgroundColor: color }}
                />
            </View>
        </View>
    )
}

/** Small "at a glance" tile. */
function MiniStat({
    icon,
    label,
    value,
    suffix,
}: {
    icon: ComponentProps<typeof Feather>['name']
    label: string
    value: string
    suffix?: string
}) {
    return (
        <View
            className="flex-1 rounded-2xl bg-white p-3.5"
            style={{
                shadowColor: '#000000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
            }}
        >
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#E7F2E9]">
                <Feather name={icon} size={14} color="#2F7A3E" />
            </View>
            <Text className="mt-2.5 text-lg font-bold text-gray-900">
                {value} {suffix ? <Text className="text-[10px] font-medium text-gray-400">{suffix}</Text> : null}
            </Text>
            <Text className="mt-0.5 text-[11px] text-gray-400">{label}</Text>
        </View>
    )
}

export default function HomeDashboard({ name, goal, onCameraPress }: HomeDashboardProps) {
    const { user, removeMeal, refreshUser } = useUserContext()
    const [meals, setMeals] = useState<MealOut[]>([])
    const [refreshing, setRefreshing] = useState(false)

    // Keep the local list in sync with context (post-delete / post-refresh),
    // showing only meals logged on the user's current local day.
    useEffect(() => {
        setMeals((user?.meals ?? []).filter(isTodayMeal))
    }, [user?.meals])

    // Refresh on focus so meals logged in the camera flow appear immediately.
    useFocusEffect(
        useCallback(() => {
            refreshUser()
        }, [refreshUser])
    )

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await refreshUser()
        } catch (err) {
            console.error('Failed to refresh meals:', err)
        } finally {
            setRefreshing(false)
        }
    }

    const handleDeleteMeal = (id: number) => {
        // Optimistic removal for instant feedback; the context + backend sync
        // behind it. If the API call fails, removeMeal re-syncs the list.
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setMeals((prev) => prev.filter((meal) => meal.id !== id))
        removeMeal(id).catch((err) => {
            console.error('Failed to delete meal:', err)
        })
    }

    const now = new Date()
    const hour = now.getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const dateLabel = `${DAYS[now.getDay()].toUpperCase()}, ${MONTHS[now.getMonth()].toUpperCase()} ${now.getDate()}`

    const totals = useMemo(
        () =>
            meals.reduce(
                (acc, meal) => ({
                    kcal: acc.kcal + meal.kcal,
                    protein: acc.protein + meal.protein,
                    carbs: acc.carbs + meal.carbs,
                    fat: acc.fat + meal.fat,
                }),
                { kcal: 0, protein: 0, carbs: 0, fat: 0 }
            ),
        [meals]
    )

    const macroGoals = useMemo(() => getDailyMacroGoals(goal), [goal])
    const eaten = totals.kcal
    const caloriesLeft = goal - eaten
    const overGoal = goal > 0 && eaten > goal
    const avgPerMeal = meals.length > 0 ? Math.round(eaten / meals.length) : 0
    const goalPercent = goal > 0 ? Math.round(Math.min(eaten / goal, 1) * 100) : 0

    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top']}>
            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#4E9F5A"
                        colors={['#4E9F5A']}
                        progressBackgroundColor="#FFFFFF"
                    />
                }
            >
                {/* Header */}
                <View className="mt-8 flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                        <View className="flex-row items-center gap-2">
                            <View className="h-2 w-2 rounded-full bg-[#4E9F5A]" />
                            <Text className="text-[11px] font-bold tracking-widest text-gray-400">
                                {dateLabel}
                            </Text>
                        </View>
                        <Text className="mt-1.5 text-xl font-bold leading-8 text-gray-900">
                            {greeting}, <Text className="text-[#2F7A3E]">{name}</Text>
                        </Text>
                        <Text className="mt-0.5 text-xs text-gray-400">
                            {goal > 0
                                ? `Daily goal ${goal.toLocaleString()} kcal`
                                : 'Complete onboarding to set your daily goal'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={onCameraPress}
                        className="h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white active:opacity-70"
                        style={{
                            shadowColor: '#000000',
                            shadowOpacity: 0.06,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 4 },
                            elevation: 3,
                        }}
                    >
                        <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#E7F2E9]">
                            <Feather name="camera" size={16} color="#2F7A3E" />
                        </View>
                    </Pressable>
                </View>

                {/* Hero calorie card */}
                <Animated.View entering={FadeInDown.duration(320)} className="mt-5">
                    <View className="overflow-hidden rounded-3xl bg-white p-5">
                        {/* soft decorative blob */}
                        <View className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#E7F2E9]" />
                        <View className="pointer-events-none absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-[#F5F0E3]" />

                        <View className="flex-row items-center">
                            <CalorieRing eaten={eaten} goal={goal} overGoal={overGoal} />
                            <View className="ml-6 flex-1 gap-3">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#F6E3E1]">
                                        <Ionicons name="restaurant-outline" size={14} color="#E0685E" />
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-400">Eaten</Text>
                                        <Text className="text-[15px] font-bold text-gray-900">
                                            {eaten.toLocaleString()}{' '}
                                            <Text className="text-[11px] font-medium text-gray-400">kcal</Text>
                                        </Text>
                                    </View>
                                </View>
                                <View className="h-px bg-gray-100" />
                                <View className="flex-row items-center gap-2">
                                    <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#E7F2E9]">
                                        <Feather name="target" size={14} color="#2F7A3E" />
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-400">Goal</Text>
                                        <Text className="text-[15px] font-bold text-gray-900">
                                            {goal.toLocaleString()}{' '}
                                            <Text className="text-[11px] font-medium text-gray-400">kcal</Text>
                                        </Text>
                                    </View>
                                </View>
                                {/* Only shown when the day's eaten total exceeds the goal —
                                    the ring already communicates what's left. */}
                                {overGoal && (
                                    <>
                                        <View className="h-px bg-gray-100" />
                                        <View className="flex-row items-center gap-2">
                                            <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#F7EDD7]">
                                                <Feather name="zap" size={14} color="#B98900" />
                                            </View>
                                            <View>
                                                <Text className="text-xs text-gray-400">Over goal</Text>
                                                <Text className="text-[15px] font-bold text-[#B98900]">
                                                    {Math.abs(caloriesLeft).toLocaleString()}{' '}
                                                    <Text className="text-[11px] font-medium text-gray-400">kcal</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Today's macros */}
                        <View className="mt-5 gap-3.5 border-t border-gray-100 pt-4">
                            <MacroProgress
                                label="Protein"
                                current={totals.protein}
                                goal={macroGoals.protein}
                                color={MACRO_COLORS.protein.color}
                                trackColor={MACRO_COLORS.protein.track}
                            />
                            <MacroProgress
                                label="Carbs"
                                current={totals.carbs}
                                goal={macroGoals.carbs}
                                color={MACRO_COLORS.carbs.color}
                                trackColor={MACRO_COLORS.carbs.track}
                            />
                            <MacroProgress
                                label="Fat"
                                current={totals.fat}
                                goal={macroGoals.fat}
                                color={MACRO_COLORS.fat.color}
                                trackColor={MACRO_COLORS.fat.track}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* At a glance */}
                <Animated.View entering={FadeInDown.delay(80).duration(320)} className="mt-7">
                    <Text className="mb-3 text-xs font-semibold tracking-wide text-gray-400">
                        AT A GLANCE
                    </Text>
                    <View className="flex-row gap-3">
                        <MiniStat icon="book-open" label="Meals today" value={String(meals.length)} />
                        <MiniStat
                            icon="pie-chart"
                            label="Avg per meal"
                            value={meals.length > 0 ? avgPerMeal.toLocaleString() : '—'}
                            suffix={meals.length > 0 ? 'kcal' : undefined}
                        />
                        <MiniStat
                            icon="flag"
                            label="Goal progress"
                            value={goal > 0 ? String(goalPercent) : '—'}
                            suffix={goal > 0 ? '%' : undefined}
                        />
                    </View>
                </Animated.View>

                {/* Today's meals */}
                <Animated.View entering={FadeInDown.delay(140).duration(320)} className="mt-7">
                    <View className="mb-3 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xs font-semibold tracking-wide text-gray-400">
                                TODAY&apos;S MEALS
                            </Text>
                            {meals.length > 0 && (
                                <View className="rounded-full bg-[#E7F2E9] px-2 py-0.5">
                                    <Text className="text-[11px] font-bold text-[#2F7A3E]">{meals.length}</Text>
                                </View>
                            )}
                        </View>
                        {meals.length > 0 ? (
                            <Text className="text-[11px] font-medium text-gray-300">Swipe to delete</Text>
                        ) : null}
                    </View>
                    <View className="gap-2.5">
                        {meals.length > 0 ? (
                            meals.map((meal) => (
                                <MealRow key={meal.id} meal={meal} onDelete={handleDeleteMeal} />
                            ))
                        ) : (
                            <View className="items-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-10">
                                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#E7F2E9]">
                                    <Ionicons name="restaurant-outline" size={28} color="#2F7A3E" />
                                </View>
                                <Text className="mt-4 text-base font-semibold text-gray-900">
                                    No meals logged yet today
                                </Text>
                                <Text className="mt-1.5 max-w-[270px] text-center text-sm leading-5 text-gray-500">
                                    Snap a photo of what you eat and your calories, protein and
                                    macros will show up here automatically.
                                </Text>
                                <Button
                                    title="Log your first meal"
                                    variant="outline"
                                    icon="camera"
                                    onPress={onCameraPress}
                                    className="mt-5"
                                />
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    )
}

import { Feather, Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useMemo, useState, type ComponentProps } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import MacroBar from '@/components/HomeScreen/MacroBar'
import Button from '@/components/ui/Button'
import { useUserContext } from '@/context/UserContext'
import { getMealHistory, type MealOut } from '@/utils/api'
import { getWeeklyMacroGoals } from '@/utils/macros'
import { buildWeekData, weekRange } from './weekData'
import WeekChart from './WeekChart'
import WeekSwitcher from './WeekSwitcher'

// Weekday of today where 0 = Monday (matches the chart's Mon-first order).
const todayIndex = (new Date().getDay() + 6) % 7

type StatTileProps = {
  icon: ComponentProps<typeof Feather>['name']
  label: string
  value: string
  suffix: string
}

function StatTile({ icon, label, value, suffix }: StatTileProps) {
  return (
    <View
      className="w-[48.5%] rounded-2xl bg-white p-4"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#E7F2E9]">
        <Feather name={icon} size={15} color="#2F7A3E" />
      </View>
      <Text className="mt-3 text-lg font-bold text-gray-900">
        {value} <Text className="text-[11px] font-medium text-gray-400">{suffix}</Text>
      </Text>
      <Text className="mt-0.5 text-[11px] text-gray-400">{label}</Text>
    </View>
  )
}

export default function HistoryScreen() {
  const { user, metric } = useUserContext()
  const clerkId = user?.clerk_id

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(todayIndex)
  const [meals, setMeals] = useState<MealOut[]>([])
  const [responseTarget, setResponseTarget] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The user's daily goal comes from their metrics; prefer the freshest value
  // returned by the history endpoint itself.
  const calorieTarget = responseTarget ?? metric?.calorie_target ?? 0

  const loadWeek = useCallback(
    async (offset: number) => {
      if (!clerkId) return
      try {
        const { start, end } = weekRange(offset)
        const data = await getMealHistory(clerkId, start, end)
        setMeals(data.meals)
        setResponseTarget(data.calorie_target)
        setError(null)
      } catch (e) {
        console.error('Failed to load history:', e)
        setError("We couldn't load your history. Check your connection and try again.")
      }
    },
    [clerkId]
  )

  // Load the week when the screen is focused (so meals logged on other tabs
  // show up), whenever the user is known, and on every week switch. Loading
  // stays true until the first successful fetch so the spinner covers the
  // moment the user is still being fetched from the backend.
  useFocusEffect(
    useCallback(() => {
      if (!clerkId) return
      setLoading(true)
      loadWeek(weekOffset).finally(() => setLoading(false))
    }, [clerkId, weekOffset, loadWeek])
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWeek(weekOffset)
    setRefreshing(false)
  }

  const handleWeekChange = (offset: number) => {
    setWeekOffset(offset)
    // Jump to today when viewing the current week, Monday otherwise.
    setSelectedIndex(offset === 0 ? todayIndex : 0)
  }

  const week = useMemo(
    () => buildWeekData(meals, calorieTarget, weekOffset),
    [meals, calorieTarget, weekOffset]
  )
  const macroGoals = useMemo(() => getWeeklyMacroGoals(calorieTarget), [calorieTarget])

  const daysWithMeals = week.days.filter((d) => d.kcal > 0)
  const bestDay = daysWithMeals.reduce((a, b) => (b.kcal > a.kcal ? b : a), daysWithMeals[0])
  const lightestDay = daysWithMeals.reduce((a, b) => (b.kcal < a.kcal ? b : a), daysWithMeals[0])

  const avgKcal = Math.round(week.totals.kcal / 7)
  const avgProtein = Math.round(week.totals.protein / 7)

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
        <View className="mt-8">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-[#4E9F5A]" />
            <Text className="text-[11px] font-bold tracking-widest text-gray-400">
              YOUR PROGRESS
            </Text>
          </View>
          <Text className="mt-1.5 text-2xl font-bold text-gray-900">History</Text>
        </View>

        {/* Week switcher */}
        <WeekSwitcher
          offset={weekOffset}
          weekLabel={week.weekLabel}
          rangeLabel={week.rangeLabel}
          onChange={handleWeekChange}
        />

        {loading ? (
          <View className="mt-4 items-center rounded-3xl bg-white py-14">
            <ActivityIndicator size="small" color="#4E9F5A" />
            <Text className="mt-3 text-sm text-gray-400">Loading your week…</Text>
          </View>
        ) : error ? (
          <View className="mt-4 items-center rounded-3xl bg-white px-6 py-12">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#F6E3E1]">
              <Feather name="wifi-off" size={24} color="#E0685E" />
            </View>
            <Text className="mt-4 text-base font-semibold text-gray-900">Something went wrong</Text>
            <Text className="mt-1.5 max-w-[260px] text-center text-sm leading-5 text-gray-500">
              {error}
            </Text>
            <Button
              title="Try Again"
              variant="outline"
              icon="refresh-cw"
              onPress={() => {
                setLoading(true)
                loadWeek(weekOffset).finally(() => setLoading(false))
              }}
              className="mt-5"
            />
          </View>
        ) : (
          <>
            {/* Onboarding notice */}
            {calorieTarget <= 0 && (
              <Animated.View entering={FadeInDown.duration(320)} className="mt-4">
                <View className="flex-row items-center gap-3 rounded-2xl border border-[#E0AA3E]/30 bg-[#FDF6E3] px-4 py-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#E0AA3E]/15">
                    <Ionicons name="flag-outline" size={16} color="#B98900" />
                  </View>
                  <Text className="flex-1 text-[13px] leading-5 text-[#8A6A1D]">
                    Complete onboarding to set your daily calorie goal — charts and stats will
                    then compare against it.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Daily calories bar chart */}
            <Animated.View
              key={`chart-${weekOffset}`}
              entering={FadeInDown.duration(320)}
              className="mt-4 rounded-3xl bg-white p-5"
            >
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#E7F2E9]">
                    <Ionicons name="bar-chart-outline" size={15} color="#2F7A3E" />
                  </View>
                  <Text className="text-base font-bold text-gray-900">Daily calories</Text>
                </View>
                {calorieTarget > 0 && (
                  <View className="flex-row items-center gap-1.5">
                    <View className="h-0 w-5 border-t-2 border-dashed border-[#E0AA3E]" />
                    <Text className="text-[11px] font-medium text-gray-400">
                      Goal {calorieTarget.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              <WeekChart
                days={week.days}
                goal={calorieTarget}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />

              {week.totals.meals === 0 && (
                <View className="mt-3 items-center rounded-2xl bg-[#F5F4F0] px-4 py-3">
                  <Feather name="coffee" size={15} color="#9CA3AF" />
                  <Text className="mt-1 text-sm text-gray-400">
                    No meals logged this week — snap a photo of your next meal!
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Week in numbers */}
            <Animated.View key={`stats-${weekOffset}`} entering={FadeInDown.delay(80).duration(320)} className="mt-7">
              <Text className="mb-3 text-xs font-semibold tracking-wide text-gray-400">
                WEEK IN NUMBERS
              </Text>
              <View className="flex-row flex-wrap justify-between gap-3">
                <StatTile icon="trending-up" label="Avg calories / day" value={avgKcal.toLocaleString()} suffix="kcal" />
                <StatTile icon="book-open" label="Logged this week" value={String(week.totals.meals)} suffix="meals" />
                <StatTile icon="award" label="Hit your kcal goal" value={String(week.totals.onTargetDays)} suffix="days" />
                <StatTile icon="droplet" label="Avg protein / day" value={avgProtein.toLocaleString()} suffix="g" />
              </View>
            </Animated.View>

            {/* Macros this week */}
            <Animated.View key={`macros-${weekOffset}`} entering={FadeInDown.delay(140).duration(320)} className="mt-7">
              <Text className="mb-3 text-xs font-semibold tracking-wide text-gray-400">
                MACROS THIS WEEK
              </Text>
              <View className="gap-4 rounded-3xl bg-white p-5">
                <MacroBar
                  label="Protein"
                  current={week.totals.protein}
                  goal={macroGoals.protein}
                  color="#E0685E"
                  trackColor="#F6E3E1"
                />
                <MacroBar
                  label="Carbs"
                  current={week.totals.carbs}
                  goal={macroGoals.carbs}
                  color="#E0AA3E"
                  trackColor="#F7EDD7"
                />
                <MacroBar
                  label="Fat"
                  current={week.totals.fat}
                  goal={macroGoals.fat}
                  color="#4E7FE0"
                  trackColor="#DDE6F8"
                />
              </View>
              <Text className="mt-2.5 text-center text-[11px] text-gray-400">
                Goals estimated from your calorie target (30% protein / 40% carbs / 30% fat)
              </Text>
            </Animated.View>

            {/* Highlights */}
            {daysWithMeals.length > 0 && (
              <Animated.View key={`highlights-${weekOffset}`} entering={FadeInDown.delay(200).duration(320)} className="mt-7">
                <Text className="mb-3 text-xs font-semibold tracking-wide text-gray-400">HIGHLIGHTS</Text>
                <View className="rounded-3xl bg-[#2F7A3E] px-5 py-2">
                  {/* Best day */}
                  <View className="flex-row items-center justify-between py-3">
                    <View className="flex-row items-center gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Ionicons name="trophy" size={16} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold tracking-wide text-[#CFE8D4]">BEST DAY</Text>
                        <Text className="text-sm font-bold text-white">{bestDay.fullLabel}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-white">
                        {bestDay.kcal.toLocaleString()}{' '}
                        <Text className="text-xs font-semibold text-[#CFE8D4]">kcal</Text>
                      </Text>
                      {calorieTarget > 0 ? (
                        <Text className="text-[11px] text-[#CFE8D4]">
                          {Math.round((bestDay.kcal / calorieTarget) * 100)}% of goal
                        </Text>
                      ) : (
                        <Text className="text-[11px] text-[#CFE8D4]">
                          {bestDay.mealCount} {bestDay.mealCount === 1 ? 'meal' : 'meals'} logged
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="h-px bg-white/10" />

                  {/* Lightest day */}
                  <View className="flex-row items-center justify-between py-3">
                    <View className="flex-row items-center gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Feather name="trending-down" size={16} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold tracking-wide text-[#CFE8D4]">LIGHTEST DAY</Text>
                        <Text className="text-sm font-bold text-white">{lightestDay.fullLabel}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-white">
                        {lightestDay.kcal.toLocaleString()}{' '}
                        <Text className="text-xs font-semibold text-[#CFE8D4]">kcal</Text>
                      </Text>
                      <Text className="text-[11px] text-[#CFE8D4]">
                        {lightestDay.mealCount} {lightestDay.mealCount === 1 ? 'meal' : 'meals'} logged
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-white/10" />

                  {/* Active days */}
                  <View className="flex-row items-center justify-between py-3">
                    <View className="flex-row items-center gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Feather name="calendar" size={16} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-[11px] font-semibold tracking-wide text-[#CFE8D4]">ACTIVE DAYS</Text>
                        <Text className="text-sm font-bold text-white">Days with meals</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-white">
                        {week.totals.activeDays} <Text className="text-xs font-semibold text-[#CFE8D4]">of 7</Text>
                      </Text>
                      <Text className="text-[11px] text-[#CFE8D4]">
                        {week.totals.meals} meals logged this week
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

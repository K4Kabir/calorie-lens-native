import { useClerk, useUser } from '@clerk/expo'
import { Feather, Ionicons } from '@expo/vector-icons'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import { EXERCISE_LEVELS, GOALS, type ExerciseLevel, type Goal } from '@/components/Onboarding/OnboardingScreen'
import { useUserContext } from '@/context/UserContext'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


/** Convert a total-feet height (e.g. 5.67) into feet + inches for display/editing. */
const heightToFtIn = (height: number) => {
    const ft = Math.floor(height)
    const inches = Math.round((height - ft) * 12)
    return { ft, inches }
}

type Draft = {
    feet: string
    inches: string
    weight: string
    age: string
    exerciseLevel: ExerciseLevel
    goal: Goal
}

export default function ProfileScreen() {
    const { signOut } = useClerk()
    const { isLoaded } = useUser()
    const { user } = useUserContext()
    const router = useRouter()
    const { metric, updateMetrics } = useUserContext()


    const [draft, setDraft] = useState<Draft | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const displayName = isLoaded && user?.name
    const email = user?.email

    // The settings tab is only reachable after onboarding, but guard anyway.
    if (!metric) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F4F0]">
                <ActivityIndicator color="#4E9F5A" />
            </SafeAreaView>
        )
    }

    const isEditing = draft !== null
    const canSave =
        draft !== null &&
        draft.feet.trim().length > 0 &&
        draft.weight.trim().length > 0 &&
        draft.age.trim().length > 0

    // Hoisted here so the height display below only converts once.
    const heightDisplay = heightToFtIn(metric.height)

    const startEditing = () => {
        const { ft, inches } = heightToFtIn(metric.height)
        setSaveError(null)
        setDraft({
            feet: String(ft),
            inches: String(inches),
            weight: String(metric.weight),
            age: String(metric.age),
            exerciseLevel: metric.exerciseLevel as ExerciseLevel,
            goal: metric.goal as Goal,
        })
    }

    console.log(draft)

    const saveChanges = async () => {
        if (!canSave || !draft) return
        setIsSaving(true)
        setSaveError(null)
        try {
            const height = Number(draft.feet) + (Number(draft.inches) || 0) / 12
            await updateMetrics({
                height: Number(height.toFixed(2)),
                weight: Number(draft.weight),
                age: Number(draft.age),
                exerciseLevel: draft.exerciseLevel,
                goal: draft.goal,
            })
            setDraft(null)
        } catch (err) {
            console.error('Failed to update metrics:', err)
            setSaveError('Could not update your stats right now. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            router.replace('/sign-in')
        } catch (err) {
            console.error(JSON.stringify(err, null, 2))
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top']}>
            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View className="mt-4 items-center">
                    <View className="h-24 w-24 items-center justify-center rounded-full bg-white p-1">
                        <Image source={require('../../..//assets/images/user.png')} className="h-full w-full rounded-full" />
                    </View>
                    <Text className="mt-3 text-2xl font-bold text-gray-900">{displayName}</Text>
                    <Text className="mt-0.5 text-sm text-gray-400">{email}</Text>
                </View>

                {/* Daily calorie goal (recomputed by the AI from the current metrics) */}
                <View className="mt-7 items-center rounded-3xl bg-[#2F7A3E] px-5 py-6">
                    <Text className="text-xs font-semibold tracking-wide text-[#CFE8D4]">
                        DAILY CALORIE GOAL
                    </Text>
                    <Text className="mt-1.5 text-4xl font-bold text-white">
                        {metric.calorie_target}
                        <Text className="text-lg font-semibold text-[#CFE8D4]"> kcal</Text>
                    </Text>
                    <Text className="mt-2 text-center text-xs text-[#CFE8D4]">
                        Auto-recalculated when you update your stats below
                    </Text>
                </View>

                {/* Edit / Save button */}
                <Button
                    className="mt-6"
                    onPress={isEditing ? saveChanges : startEditing}
                    disabled={isEditing && (!canSave || isSaving)}
                    variant={isEditing ? 'primary' : 'outline'}
                    icon={isEditing ? 'check' : 'edit-2'}
                    title={isEditing ? (isSaving ? 'Recalculating…' : 'Save Changes') : 'Edit Stats'}
                />
                {isEditing && (
                    <Button
                        variant="ghost"
                        title="Cancel"
                        onPress={() => setDraft(null)}
                        className="mt-3 py-1"
                    />
                )}
                {saveError ? (
                    <Text className="mt-3 text-center text-sm text-red-600">{saveError}</Text>
                ) : null}

                {/* Metrics */}
                <View className="mt-7">
                    <Text className="mb-3 text-xs font-semibold tracking-wide text-gray-400">MY STATS</Text>
                    <View className="overflow-hidden rounded-3xl bg-white">
                        {/* Height */}
                        <View className="flex-row items-center px-5 py-4">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E9]">
                                <Ionicons name="resize-outline" size={18} color="#4E9F5A" />
                            </View>
                            <View className="ml-3.5 flex-1">
                                <Text className="text-xs text-gray-400">Height</Text>
                                {isEditing ? (
                                    <View className="mt-1.5 flex-row gap-2.5">
                                        <TextField
                                            value={draft.feet}
                                            onChangeText={(t) => setDraft({ ...draft, feet: t })}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="5"
                                            suffix="ft"
                                            containerClassName="flex-1 rounded-xl bg-gray-50 px-3 min-w-[80px]"
                                            inputClassName="py-2"
                                        />
                                        <TextField
                                            value={draft.inches}
                                            onChangeText={(t) => setDraft({ ...draft, inches: t })}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="8"
                                            suffix="in"
                                            containerClassName="flex-1 rounded-xl bg-gray-50 px-3 min-w-[80px]"
                                            inputClassName="py-2"
                                        />
                                    </View>
                                ) : (
                                    <Text className="mt-0.5 text-base font-bold text-gray-900">
                                        {heightDisplay.ft}&apos;{heightDisplay.inches}&quot;
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View className="mx-5 h-px bg-gray-100" />

                        {/* Total weight */}
                        <View className="flex-row items-center px-5 py-4">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E9]">
                                <Ionicons name="scale-outline" size={18} color="#4E9F5A" />
                            </View>
                            <View className="ml-3.5 flex-1">
                                <Text className="text-xs text-gray-400">Total Weight</Text>
                                {isEditing ? (
                                    <TextField
                                        value={draft.weight}
                                        onChangeText={(t) => setDraft({ ...draft, weight: t })}
                                        keyboardType="decimal-pad"
                                        placeholder="Weight"
                                        suffix="kg"
                                        containerClassName="mt-1.5 rounded-xl bg-gray-50 px-3"
                                        inputClassName="py-2"
                                    />
                                ) : (
                                    <Text className="mt-0.5 text-base font-bold text-gray-900">{metric.weight} kg</Text>
                                )}
                            </View>
                        </View>

                        <View className="mx-5 h-px bg-gray-100" />

                        {/* Age */}
                        <View className="flex-row items-center px-5 py-4">
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E9]">
                                <Ionicons name="person-outline" size={18} color="#4E9F5A" />
                            </View>
                            <View className="ml-3.5 flex-1">
                                <Text className="text-xs text-gray-400">Age</Text>
                                {isEditing ? (
                                    <TextField
                                        value={draft.age}
                                        onChangeText={(t) => setDraft({ ...draft, age: t })}
                                        keyboardType="number-pad"
                                        maxLength={3}
                                        placeholder="Age"
                                        suffix="yrs"
                                        containerClassName="mt-1.5 rounded-xl bg-gray-50 px-3"
                                        inputClassName="py-2"
                                    />
                                ) : (
                                    <Text className="mt-0.5 text-base font-bold text-gray-900">{metric.age} yrs</Text>
                                )}
                            </View>
                        </View>

                        <View className="mx-5 h-px bg-gray-100" />

                        {/* Exercise */}
                        <View className="px-5 py-4">
                            <View className="flex-row items-center">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E9]">
                                    <Feather name="activity" size={18} color="#4E9F5A" />
                                </View>
                                <View className="ml-3.5 flex-1">
                                    <Text className="text-xs text-gray-400">Exercise</Text>
                                    {!isEditing && (
                                        <Text className="mt-0.5 text-base font-bold text-gray-900">
                                            {metric.exerciseLevel}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {isEditing && draft && (
                                <View className="mt-3 flex-row gap-2.5">
                                    {EXERCISE_LEVELS.map((level) => {
                                        const selected = draft.exerciseLevel === level
                                        return (
                                            <Pressable
                                                key={level}
                                                onPress={() => setDraft({ ...draft, exerciseLevel: level })}
                                                className={`flex-1 items-center rounded-xl border py-2.5 active:opacity-70 ${selected
                                                    ? 'border-[#4E9F5A] bg-[#E7F2E9]'
                                                    : 'border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-xs font-semibold ${selected ? 'text-[#2F7A3E]' : 'text-gray-600'
                                                        }`}
                                                >
                                                    {level}
                                                </Text>
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            )}
                        </View>

                        <View className="mx-5 h-px bg-gray-100" />

                        {/* Goal */}
                        <View className="px-5 py-4">
                            <View className="flex-row items-center">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F2E9]">
                                    <Feather name="target" size={18} color="#4E9F5A" />
                                </View>
                                <View className="ml-3.5 flex-1">
                                    <Text className="text-xs text-gray-400">Goal</Text>
                                    {!isEditing && (
                                        <Text className="mt-0.5 text-base font-bold text-gray-900">{metric.goal}</Text>
                                    )}
                                </View>
                            </View>
                            {isEditing && draft && (
                                <View className="mt-3 gap-2">
                                    {GOALS.map(({ value, icon }) => {
                                        const selected = draft.goal === value
                                        return (
                                            <Pressable
                                                key={value}
                                                onPress={() => setDraft({ ...draft, goal: value })}
                                                className={`flex-row items-center rounded-xl border px-3.5 py-2.5 active:opacity-70 ${selected
                                                    ? 'border-[#4E9F5A] bg-[#E7F2E9]'
                                                    : 'border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <Feather
                                                    name={icon}
                                                    size={14}
                                                    color={selected ? '#2F7A3E' : '#6B7280'}
                                                />
                                                <Text
                                                    className={`ml-2.5 flex-1 text-sm font-semibold ${selected ? 'text-[#2F7A3E]' : 'text-gray-600'
                                                        }`}
                                                >
                                                    {value}
                                                </Text>
                                                <View
                                                    className={`h-5 w-5 rounded-full border-2 ${selected
                                                        ? 'border-[#4E9F5A] bg-[#4E9F5A]'
                                                        : 'border-gray-300 bg-white'
                                                        }`}
                                                />
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sign out */}
                <Button
                    variant="danger"
                    icon="log-out"
                    title="Sign Out"
                    onPress={handleSignOut}
                    className="mt-8"
                />
            </ScrollView>
        </SafeAreaView>
    )
}

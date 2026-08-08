import { Feather, Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'

export type ExerciseLevel = 'Low' | 'Moderate' | 'High'
export type Goal = 'Maintain weight' | 'Lose weight' | 'Gain weight'

export type OnboardingData = {
    height: string // total feet, e.g. "5.67" for 5'8"
    weight: string
    age: string
    exerciseLevel: ExerciseLevel | null
    goal: Goal | null
}

type OnboardingScreenProps = {
    onComplete: (data: OnboardingData) => void
    /** Optional error message shown above the submit button (e.g. save failure). */
    error?: string | null
    loading: boolean
}

export const EXERCISE_LEVELS: ExerciseLevel[] = ['Low', 'Moderate', 'High']

export const GOALS: { value: Goal; icon: keyof typeof Feather.glyphMap }[] = [
    { value: 'Maintain weight', icon: 'minimize-2' },
    { value: 'Lose weight', icon: 'trending-down' },
    { value: 'Gain weight', icon: 'trending-up' },
]

export default function OnboardingScreen({ onComplete, error, loading }: OnboardingScreenProps) {
    const [feet, setFeet] = useState('')
    const [inches, setInches] = useState('')
    const [weight, setWeight] = useState('')
    const [age, setAge] = useState('')
    const [exerciseLevel, setExerciseLevel] = useState<ExerciseLevel | null>(null)
    const [goal, setGoal] = useState<Goal | null>(null)

    const isComplete =
        feet.trim().length > 0 &&
        weight.trim().length > 0 &&
        age.trim().length > 0 &&
        exerciseLevel !== null &&
        goal !== null

    const handleSubmit = () => {
        if (!isComplete) return
        const heightFt = (Number(feet) + (Number(inches) || 0) / 12).toFixed(2)
        onComplete({ height: heightFt, weight: weight.trim(), age: age.trim(), exerciseLevel, goal })
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
                    <View className="h-16 w-16 items-center justify-center rounded-3xl bg-[#E7F2E9]">
                        <Ionicons name="sparkles" size={28} color="#4E9F5A" />
                    </View>
                    <Text className="mt-4 text-2xl font-bold text-gray-900">Let&apos;s set you up</Text>
                    <Text className="mt-1.5 text-center text-sm text-gray-500">
                        Tell us a bit about yourself so we can personalize your plan.
                    </Text>
                </View>

                {/* Height */}
                <View className="mt-7">
                    <Text className="mb-2 text-xs font-semibold tracking-wide text-gray-400">HEIGHT</Text>
                    <View className="flex-row gap-3">
                        <TextField
                            className="flex-1"
                            label="Feet"
                            icon="resize"
                            suffix="ft"
                            value={feet}
                            onChangeText={setFeet}
                            placeholder="e.g. 5"
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                        <TextField
                            className="flex-1"
                            label="Inches"
                            icon="resize"
                            suffix="in"
                            value={inches}
                            onChangeText={setInches}
                            placeholder="e.g. 8"
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>
                </View>

                {/* Total weight */}
                <TextField
                    className="mt-5"
                    label="Total weight"
                    icon="scale-outline"
                    suffix="kg"
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="e.g. 68"
                    keyboardType="decimal-pad"
                />

                {/* Age */}
                <TextField
                    className="mt-5"
                    label="Age"
                    icon="person-outline"
                    suffix="yrs"
                    value={age}
                    onChangeText={setAge}
                    placeholder="e.g. 25"
                    keyboardType="number-pad"
                    maxLength={3}
                />

                {/* Exercise level */}
                <View className="mt-7">
                    <Text className="mb-2 text-xs font-semibold tracking-wide text-gray-400">EXERCISE</Text>
                    <View className="flex-row gap-2.5">
                        {EXERCISE_LEVELS.map((level) => {
                            const selected = exerciseLevel === level
                            return (
                                <Pressable
                                    key={level}
                                    onPress={() => setExerciseLevel(level)}
                                    className={`flex-1 items-center rounded-2xl border py-3.5 active:opacity-70 ${selected
                                        ? 'border-[#4E9F5A] bg-[#E7F2E9]'
                                        : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${selected ? 'text-[#2F7A3E]' : 'text-gray-600'
                                            }`}
                                    >
                                        {level}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>

                {/* Goal */}
                <View className="mt-7">
                    <Text className="mb-2 text-xs font-semibold tracking-wide text-gray-400">GOAL</Text>
                    <View className="gap-2.5">
                        {GOALS.map(({ value, icon }) => {
                            const selected = goal === value
                            return (
                                <Pressable
                                    key={value}
                                    onPress={() => setGoal(value)}
                                    className={`flex-row items-center rounded-2xl border px-4 py-3.5 active:opacity-70 ${selected
                                        ? 'border-[#4E9F5A] bg-[#E7F2E9]'
                                        : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <View
                                        className={`h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-[#4E9F5A]' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Feather name={icon} size={16} color={selected ? '#FFFFFF' : '#6B7280'} />
                                    </View>
                                    <Text
                                        className={`ml-3 flex-1 text-sm font-semibold ${selected ? 'text-[#2F7A3E]' : 'text-gray-700'
                                            }`}
                                    >
                                        {value}
                                    </Text>
                                    <View
                                        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-[#4E9F5A] bg-[#4E9F5A]' : 'border-gray-300 bg-white'
                                            }`}
                                    >
                                        {selected && <View className="h-2 w-2 rounded-full bg-white" />}
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>

                {/* Submit */}
                {error ? (
                    <Text className="mt-5 text-center text-sm text-red-600">{error}</Text>
                ) : null}
                <Button
                    loading={loading}
                    className="mt-5"
                    title="Get Started"
                    onPress={handleSubmit}
                    disabled={!isComplete}
                />
            </ScrollView>
        </SafeAreaView>
    )
}

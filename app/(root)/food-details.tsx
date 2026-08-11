import Button from '@/components/ui/Button'
import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { analyzeMealImage, createMeal, type MealAnalysisResult } from '@/utils/api'
import { useUserContext } from '@/context/UserContext'

const MACRO_META = [
    { label: 'Protein', key: 'protein', unit: 'g', color: '#E0685E' },
    { label: 'Carbs', key: 'carbs', unit: 'g', color: '#E0AA3E' },
    { label: 'Fat', key: 'fat', unit: 'g', color: '#4E7FE0' },
] as const

export default function FoodDetailsScreen() {
    const router = useRouter()
    const { photoUri, nav } = useLocalSearchParams<any>()
    const { user, refreshUser } = useUserContext()

    const [analysis, setAnalysis] = useState<MealAnalysisResult | null>(null)
    const [details, setDetails] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [logging, setLogging] = useState(false)

    const runAnalysis = useCallback(
        async (extraDescription: string) => {
            if (!photoUri) return
            setAnalyzing(true)
            setError(null)
            try {
                // The photo (and optional user description) is uploaded as
                // multipart binary — no base64 encoding.
                const result = await analyzeMealImage(
                    photoUri,
                    extraDescription.trim() || undefined
                )
                setAnalysis(result)
            } catch (err: any) {
                setAnalysis(null)
                setError(
                    err?.response?.data?.detail ??
                    'Something went wrong while analyzing your meal. Please try again.'
                )
            } finally {
                setAnalyzing(false)
            }
        },
        [photoUri]
    )

    useEffect(() => {
        runAnalysis('')
    }, [runAnalysis])

    const handleLogFood = async () => {
        if (!analysis || logging) return
        // /meals/create takes the DB user id (integer FK), not the Clerk id.
        if (!user?.id) {
            Alert.alert('Not signed in', 'Please sign in before logging a meal.')
            return
        }
        setLogging(true)
        try {
            // The photo is uploaded as multipart binary; the backend stores it
            // in Cloudinary and keeps only the returned URL in the DB.
            await createMeal(
                {
                    title: analysis.title,
                    description: analysis.description ?? '',
                    time: analysis.time,
                    protein: analysis.protein,
                    carbs: analysis.carbs,
                    fat: analysis.fat,
                    kcal: analysis.kcal,
                    user_id: user.id,
                },
                typeof photoUri === 'string' ? photoUri : null
            )
            // Pull the latest user (with the new meal) so the home screen's
            // list, "eaten" total and calorie ring update immediately.
            await refreshUser()
            router.dismissTo('/')
        } catch (err: any) {
            Alert.alert(
                'Could not log meal',
                err?.response?.data?.detail ?? 'Something went wrong while saving your meal. Please try again.'
            )
        } finally {
            setLogging(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top', 'bottom']}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image */}
                <View className="relative">
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} className="h-72 w-full" resizeMode="cover" />
                    ) : (
                        <View className="h-72 w-full items-center justify-center bg-gray-200">
                            <Feather name="image" size={40} color="#9CA3AF" />
                        </View>
                    )}
                    <Pressable
                        onPress={() => router.back()}
                        className="absolute left-5 top-5 h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70"
                    >
                        <Feather name="chevron-left" size={22} color="#FFFFFF" />
                    </Pressable>
                    <View className="absolute bottom-4 left-5 rounded-full bg-black/50 px-3 py-1.5">
                        <Text className="text-xs font-semibold text-white">AI Detected Food</Text>
                    </View>
                </View>

                <View className="flex-1 px-5 mb-5">
                    {/* Extra details — re-analyzes the meal with the user's note */}
                    {photoUri && !analyzing && (
                        <View className="-mt-6 rounded-3xl bg-white p-5 shadow-sm">
                            <View className="flex-row items-center gap-2">
                                <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#E7F2E9]">
                                    <Feather name="edit-3" size={14} color="#2F7A3E" />
                                </View>
                                <Text className="text-xs font-semibold tracking-wide text-gray-400">
                                    ADD DETAILS
                                </Text>
                            </View>
                            <TextInput
                                value={details}
                                onChangeText={setDetails}
                                placeholder="e.g. Grilled chicken with brown rice, no oil, extra vegetables"
                                placeholderTextColor="#C4C4C0"
                                multiline
                                maxLength={300}
                                className="mt-3 min-h-[76px] rounded-2xl bg-gray-50 p-3.5 text-sm leading-5 text-gray-900"
                                style={{ textAlignVertical: 'top', includeFontPadding: false }}
                            />
                            <Button
                                title="Update Analysis"
                                icon="refresh-cw"
                                variant="outline"
                                loading={analyzing}
                                disabled={analyzing || logging || !details.trim()}
                                onPress={() => runAnalysis(details)}
                                className="mt-3"
                            />
                        </View>
                    )}

                    {/* Analyzing */}
                    {analyzing && (
                        <View className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
                            <View className="items-center py-6">
                                <ActivityIndicator size="large" color="#4E9F5A" />
                                <Text className="mt-4 text-base font-semibold text-gray-900">
                                    Analyzing your meal…
                                </Text>
                                <Text className="mt-1 text-sm text-gray-400">
                                    Identifying the dish and estimating nutrition.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Analysis failed */}
                    {!analyzing && error && (
                        <View className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
                            <View className="items-center py-4">
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-red-50">
                                    <Feather name="alert-triangle" size={26} color="#DC2626" />
                                </View>
                                <Text className="mt-4 text-base font-semibold text-gray-900">
                                    Couldn’t analyze your meal
                                </Text>
                                <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
                                    {error}
                                </Text>
                                <Button
                                    title="Try Again"
                                    icon="refresh-cw"
                                    onPress={() => runAnalysis(details)}
                                    className="mt-5 px-8"
                                />
                            </View>
                        </View>
                    )}

                    {/* Analysis result */}
                    {!analyzing && !error && analysis && (
                        <>
                            <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
                                <View className="flex-row items-center justify-between">
                                    <Text className="flex-1 text-xl font-bold text-gray-900">
                                        {analysis.title}
                                    </Text>
                                    <View className="ml-3 rounded-full bg-[#E7F2E9] px-3 py-1">
                                        <Text className="text-xs font-semibold text-[#2F7A3E]">
                                            {analysis.time}
                                        </Text>
                                    </View>
                                </View>
                                {analysis.description ? (
                                    <Text className="mt-1.5 text-sm leading-5 text-gray-500">
                                        {analysis.description}
                                    </Text>
                                ) : null}

                                <View className="mt-4 flex-row items-end">
                                    <Text className="text-4xl font-bold text-gray-900">{analysis.kcal}</Text>
                                    <Text className="mb-1 ml-1.5 text-sm font-medium text-gray-400">kcal</Text>
                                </View>

                                <View className="mt-5 flex-row gap-3">
                                    {MACRO_META.map((macro) => (
                                        <View key={macro.label} className="flex-1 rounded-2xl bg-gray-50 p-3.5">
                                            <View
                                                className="h-1.5 w-8 rounded-full"
                                                style={{ backgroundColor: macro.color }}
                                            />
                                            <Text className="mt-2.5 text-lg font-bold text-gray-900">
                                                {analysis[macro.key]}
                                                <Text className="text-xs font-medium text-gray-400"> {macro.unit}</Text>
                                            </Text>
                                            <Text className="mt-0.5 text-xs font-medium text-gray-400">{macro.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View className="mt-4 rounded-3xl bg-white p-5">
                                <Text className="text-xs font-semibold tracking-wide text-gray-400">NOTES</Text>
                                <Text className="mt-2 text-sm leading-5 text-gray-600">
                                    Nutrition values are AI estimates based on your photo. Double-check
                                    before logging if you’re tracking precise macros.
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Log button */}
            {!nav && !analyzing && analysis && (
                <View className="border-t border-gray-100 bg-white px-5 pb-4 pt-3">
                    <Button
                        loading={logging}
                        title="Log Meal"
                        onPress={handleLogFood}
                    />
                </View>
            )}
        </SafeAreaView>
    )
}

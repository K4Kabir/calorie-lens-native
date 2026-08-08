import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '@/components/ui/Button'
import { useUserContext } from '@/context/UserContext'
import { getMealById, type MealOut } from '@/utils/api'

const MACRO_META = [
    { label: 'Protein', key: 'protein', unit: 'g', color: '#E0685E' },
    { label: 'Carbs', key: 'carbs', unit: 'g', color: '#E0AA3E' },
    { label: 'Fat', key: 'fat', unit: 'g', color: '#4E7FE0' },
] as const

export default function MealDetailsScreen() {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()
    const { user, removeMeal } = useUserContext()
    const mealId = Number(id)

    // Render instantly from the context's meal list (no flash), then fetch the
    // fresh row via GET /meals/{id}.
    const [meal, setMeal] = useState<MealOut | null>(
        user?.meals?.find((m) => m.id === mealId) ?? null
    )
    const [loading, setLoading] = useState(!meal)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        let mounted = true
        if (!Number.isFinite(mealId)) {
            setError('This meal could not be found.')
            setLoading(false)
            return
        }
        getMealById(mealId)
            .then((fresh) => {
                if (!mounted) return
                setMeal(fresh)
                setError(null)
            })
            .catch((err: any) => {
                if (!mounted) return
                setError(
                    err?.response?.data?.detail ??
                        'Could not load this meal. Please try again.'
                )
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => {
            mounted = false
        }
    }, [mealId])

    const confirmDelete = () => {
        Alert.alert('Delete meal', `Delete "${meal?.title}"? This can't be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: handleDelete,
            },
        ])
    }

    const handleDelete = async () => {
        if (deleting) return
        setDeleting(true)
        try {
            await removeMeal(mealId)
            router.back()
        } catch (err: any) {
            Alert.alert(
                'Could not delete meal',
                err?.response?.data?.detail ??
                    'Something went wrong while deleting this meal. Please try again.'
            )
        } finally {
            setDeleting(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F5F4F0]" edges={['top', 'bottom']}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image header */}
                <View className="relative">
                    {meal?.image ? (
                        <Image source={{ uri: meal.image }} className="h-72 w-full" resizeMode="cover" />
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
                    {meal?.time ? (
                        <View className="absolute bottom-4 left-5 rounded-full bg-black/50 px-3 py-1.5">
                            <Text className="text-xs font-semibold text-white">{meal.time}</Text>
                        </View>
                    ) : null}
                </View>

                <View className="flex-1 px-5">
                    {/* Loading */}
                    {loading && (
                        <View className="-mt-6 rounded-3xl bg-white p-8 shadow-sm">
                            <View className="items-center py-6">
                                <ActivityIndicator size="large" color="#4E9F5A" />
                                <Text className="mt-4 text-base font-semibold text-gray-900">
                                    Loading meal…
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Load failed */}
                    {!loading && error && !meal && (
                        <View className="-mt-6 rounded-3xl bg-white p-8 shadow-sm">
                            <View className="items-center py-4">
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-red-50">
                                    <Feather name="alert-triangle" size={26} color="#DC2626" />
                                </View>
                                <Text className="mt-4 text-base font-semibold text-gray-900">
                                    Couldn’t load this meal
                                </Text>
                                <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
                                    {error}
                                </Text>
                                <Button
                                    title="Go Back"
                                    icon="arrow-left"
                                    onPress={() => router.back()}
                                    className="mt-5 px-8"
                                />
                            </View>
                        </View>
                    )}

                    {/* Meal details */}
                    {!loading && meal && (
                        <>
                            <View className="-mt-6 rounded-3xl bg-white p-5 shadow-sm">
                                <View className="flex-row items-center justify-between">
                                    <Text className="flex-1 text-xl font-bold text-gray-900">
                                        {meal.title}
                                    </Text>
                                    <View className="ml-3 rounded-full bg-[#E7F2E9] px-3 py-1">
                                        <Text className="text-xs font-semibold text-[#2F7A3E]">
                                            {meal.time}
                                        </Text>
                                    </View>
                                </View>
                                {meal.description ? (
                                    <Text className="mt-1.5 text-sm leading-5 text-gray-500">
                                        {meal.description}
                                    </Text>
                                ) : null}

                                <View className="mt-4 flex-row items-end">
                                    <Text className="text-4xl font-bold text-gray-900">{meal.kcal}</Text>
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
                                                {meal[macro.key]}
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
                                    Nutrition values are AI estimates. Tap the trash icon below to
                                    remove this meal from your log.
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Delete */}
            {!loading && meal && (
                <View className="border-t border-gray-100 bg-white px-5 pb-4 pt-3">
                    <Button
                        loading={deleting}
                        title="Delete Meal"
                        icon="trash-2"
                        variant="danger"
                        onPress={confirmDelete}
                    />
                </View>
            )}
        </SafeAreaView>
    )
}

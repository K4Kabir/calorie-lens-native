import { Feather, Ionicons } from '@expo/vector-icons'
import Button from '@/components/ui/Button'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function CameraScreen() {
    const router = useRouter()
    const cameraRef = useRef<CameraView>(null)
    const [permission, requestPermission] = useCameraPermissions()
    const [capturing, setCapturing] = useState(false)

    const takePicture = async () => {
        if (!cameraRef.current || capturing) return
        setCapturing(true)
        try {
            const photo = await cameraRef.current.takePictureAsync()
            if (photo?.uri) {
                router.push({ pathname: '/food-details', params: { photoUri: photo.uri } })
            }
        } catch (err) {
            console.error('Failed to take picture', err)
        } finally {
            setCapturing(false)
        }
    }

    if (!permission) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <StatusBar style="light" />
                <ActivityIndicator color="#FFFFFF" />
            </View>
        )
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 items-center justify-center bg-[#F5F4F0] px-8">
                <View className="h-16 w-16 items-center justify-center rounded-3xl bg-[#E7F2E9]">
                    <Ionicons name="camera-outline" size={28} color="#4E9F5A" />
                </View>
                <Text className="mt-4 text-center text-lg font-bold text-gray-900">Camera access needed</Text>
                <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
                    We need your camera so you can take a photo of your meal and log it.
                </Text>
                <Button
                    title="Grant Permission"
                    onPress={requestPermission}
                    className="mt-6 px-8"
                />
            </View>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
            <StatusBar style="light" />
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

            {/* Top bar */}
            <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pt-20">
                <Pressable
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center rounded-full bg-black/40 active:opacity-70"
                >
                    <Feather name="x" size={20} color="#FFFFFF" />
                </Pressable>
                <Text className="text-sm font-semibold text-white/90">Capture your meal</Text>
                <View className="h-11 w-11" />
            </View>

            {/* Shutter */}
            <View className="absolute inset-x-0 bottom-0 items-center pb-10">
                <Pressable
                    onPress={takePicture}
                    disabled={capturing}
                    className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 active:opacity-70"
                >
                    <View className={`h-14 w-14 rounded-full bg-white ${capturing ? 'opacity-50' : ''}`} />
                </Pressable>
                <Text className="mt-3 text-xs font-medium text-white/60">
                    {capturing ? 'Processing…' : 'Tap to take a photo'}
                </Text>
            </View>
        </SafeAreaView>
    )
}

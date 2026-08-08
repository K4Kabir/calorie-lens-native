import HomeDashboard from '@/components/HomeScreen/HomeDashboard';
import { useUserContext } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import React from 'react';


export default function HomeDashboardDemo() {
    const router = useRouter()
    const { user, metric } = useUserContext()

    // Use the real user from the check API + the AI-computed calorie goal
    // from their metrics; fall back to 0 while loading / pre-onboarding.
    const goal = metric?.calorie_target ?? 0
    const name = user?.name?.split(' ')[0] ?? ''

    return (
        <HomeDashboard
            name={name}
            goal={goal}
            onCameraPress={() => router.push('/camera')}
        />
    )
}

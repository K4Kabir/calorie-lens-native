import { useAuth, useSignUp } from '@clerk/expo'
import AuthShell from '@/components/Auth/AuthShell'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function SignUp() {
    const { signUp, errors, fetchStatus } = useSignUp()
    const { isSignedIn } = useAuth()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [code, setCode] = React.useState('')

    const completeSignUp = async () => {
        await signUp.finalize({
            navigate: ({ session, decorateUrl }) => {
                // Handle session tasks
                // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
                if (session?.currentTask) {
                    return
                }

                // If no session tasks, navigate the signed-in user to the home page
                const url = decorateUrl('/')
                if (url.startsWith('http')) {
                    window.location.href = url
                } else {
                    router.push(url as Href)
                }
            },
        })
    }

    const handleSubmit = async () => {
        const { error } = await signUp.password({
            emailAddress,
            password,
        })
        if (error) {
            console.error(JSON.stringify(error, null, 2))
            return
        }

        if (!error) await signUp.verifications.sendEmailCode()
    }

    const handleVerify = async () => {
        await signUp.verifications.verifyEmailCode({
            code,
        })
        if (signUp.status === 'complete') {
            await completeSignUp()
        } else {
            // Check why the sign-up is not complete
            console.error('Sign-up attempt not complete:', signUp)
        }
    }

    if (signUp.status === 'complete' || isSignedIn) {
        return null
    }

    if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
    ) {
        return (
            <AuthShell
                title="Verify your account"
                subtitle="We've emailed you a 6-digit verification code. Enter it below to activate your account."
            >
                <TextField
                    icon="keypad-outline"
                    value={code}
                    placeholder="6-digit code"
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    error={errors.fields.code?.message}
                />
                <Button
                    title="Verify email"
                    onPress={handleVerify}
                    loading={fetchStatus === 'fetching'}
                    disabled={!code}
                    className="mt-6"
                />
                <Button
                    variant="ghost"
                    title="I need a new code"
                    onPress={() => signUp.verifications.sendEmailCode()}
                    className="mt-3 py-1"
                />
            </AuthShell>
        )
    }

    return (
        <AuthShell
            title="Create your account"
            subtitle="Start tracking your meals in seconds."
            footer={
                <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm text-gray-500">Already have an account?</Text>
                    <Link href="/sign-in">
                        <Text className="text-sm font-bold text-[#2F7A3E]">Sign in</Text>
                    </Link>
                </View>
            }
        >
            <TextField
                label="Email address"
                icon="mail-outline"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                value={emailAddress}
                placeholder="you@example.com"
                onChangeText={setEmailAddress}
                error={errors.fields.emailAddress?.message}
            />
            <TextField
                className="mt-5"
                label="Password"
                icon="lock-closed-outline"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                value={password}
                placeholder="Create a password"
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                error={errors.fields.password?.message}
            />
            <Text className="mt-1.5 text-[11px] text-gray-400">Use at least 8 characters.</Text>
            <Button
                title="Create account"
                onPress={handleSubmit}
                disabled={!emailAddress || !password}
                loading={fetchStatus === 'fetching'}
                className="mt-6"
            />

            {/* Required for sign-up flows on Expo web. Clerk skips the browser CAPTCHA on iOS and Android */}
            <View nativeID="clerk-captcha" />
        </AuthShell>
    )
}

import { useSignIn } from '@clerk/expo'
import AuthShell from '@/components/Auth/AuthShell'
import Button from '@/components/ui/Button'
import TextField from '@/components/ui/TextField'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function Page() {
    const { signIn, errors, fetchStatus } = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [code, setCode] = React.useState('')

    const completeSignIn = async () => {
        await signIn.finalize({
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
        const { error } = await signIn.password({
            emailAddress,
            password,
        })
        if (error) {
            console.error(JSON.stringify(error, null, 2))
            return
        }

        if (signIn.status === 'complete') {
            await completeSignIn()
        } else if (signIn.status === 'needs_second_factor') {
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
        } else if (signIn.status === 'needs_client_trust') {
            // For other second factor strategies,
            // see https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
            const emailCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'email_code',
            )

            if (emailCodeFactor) {
                await signIn.mfa.sendEmailCode()
            }
        } else {
            // Check why the sign-in is not complete
            console.error('Sign-in attempt not complete:', signIn)
        }
    }

    const handleVerify = async () => {
        await signIn.mfa.verifyEmailCode({ code })

        if (signIn.status === 'complete') {
            await completeSignIn()
        } else {
            // Check why the sign-in is not complete
            console.error('Sign-in attempt not complete:', signIn)
        }
    }

    if (signIn.status === 'needs_client_trust') {
        return (
            <AuthShell
                title="Verify your account"
                subtitle="We've emailed you a verification code. Enter it below to finish signing in."
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
                    title="Verify"
                    onPress={handleVerify}
                    loading={fetchStatus === 'fetching'}
                    disabled={!code}
                    className="mt-6"
                />
                <Button
                    variant="ghost"
                    title="I need a new code"
                    onPress={() => signIn.mfa.sendEmailCode()}
                    className="mt-3 py-1"
                />
                <Button
                    variant="ghost"
                    title="Start over"
                    onPress={() => signIn.reset()}
                    className="mt-1 py-1"
                />
            </AuthShell>
        )
    }

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Log in to keep tracking your meals."
            footer={
                <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm text-gray-500">Don&apos;t have an account?</Text>
                    <Link href="/sign-up">
                        <Text className="text-sm font-bold text-[#2F7A3E]">Sign up</Text>
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
                error={errors.fields.identifier?.message}
            />
            <TextField
                className="mt-5"
                label="Password"
                icon="lock-closed-outline"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                value={password}
                placeholder="Enter your password"
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
                error={errors.fields.password?.message}
            />
            <Button
                title="Log in"
                onPress={handleSubmit}
                disabled={!emailAddress || !password}
                loading={fetchStatus === 'fetching'}
                className="mt-6"
            />
        </AuthShell>
    )
}

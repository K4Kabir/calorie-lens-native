import { useAuth } from "@clerk/expo";
import LoadingScreen from "@/components/LoadingScreen";
import { Redirect } from "expo-router";

export default function Index() {

  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />
  }


  return (
    <Redirect href="/sign-in" />
  );
}

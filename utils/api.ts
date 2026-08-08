import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";
import type { OnboardingData } from "@/components/Onboarding/OnboardingScreen";

const API_PORT = 8000;

/**
 * Resolves the backend base URL for the current environment.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL from `.env` — set this for production/preview
 *     deployments instead of the dev heuristics below.
 *  2. The Metro dev-server host (`Constants.expoConfig.hostUri`, e.g.
 *     "192.168.1.7:8081") — in Expo Go / dev builds this is your dev
 *     machine's LAN IP, so it works on simulators AND physical devices on
 *     the same Wi-Fi. The backend must listen on 0.0.0.0 for this to work:
 *       uvicorn main:app --host 0.0.0.0 --port 8000 --reload
 *  3. Platform fallbacks: the Android emulator reaches the host machine via
 *     10.0.2.2; the iOS simulator / web can use 127.0.0.1 directly.
 */
function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:${API_PORT}`;

  if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
  return `http://127.0.0.1:${API_PORT}`;
}

export const BASE_URL = resolveBaseUrl();

/* ---------------------------------- Types ---------------------------------- */

/** Mirrors the backend `metrics` table / MetricsOut schema. */
export type MetricsOut = {
  id: number;
  age: number;
  height: number; // total feet, e.g. 5.67 for 5'8"
  weight: number;
  exerciseLevel: string;
  goal: string;
  calorie_target: number;
  user_id: number;
};

export type MealOut = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
  user_id: number;
  /** ISO instant the meal was logged (UTC) — drives the weekly history chart. */
  created_at: string;
};

/** Payload of GET /meals/history for a given date range. */
export type HistoryResponse = {
  calorie_target: number | null;
  start: string;
  end: string;
  meals: MealOut[];
};

/** Mirrors the backend UserOut schema. `metric` is null until onboarded. */
export type UserOut = {
  id: number;
  name: string;
  username: string;
  email: string;
  clerk_id: string;
  meals: MealOut[];
  metric: MetricsOut | null;
};

export type CheckUserInput = {
  name: string;
  username: string;
  email: string;
  clerk_id: string;
};

/** Payload used to recompute metrics (onboarding + settings updates). */
export type MetricsUpdateInput = {
  height: number; // total feet
  weight: number;
  age: number;
  exerciseLevel: string;
  goal: string;
};

/* -------------------------------- Endpoints -------------------------------- */

/**
 * POST /users/check — ensures the Clerk user exists in the backend and returns
 * the full user (with their single `metric`, if onboarding is complete).
 */
export async function checkUser(data: CheckUserInput): Promise<UserOut> {
  const response = await axios.post(`${BASE_URL}/users/check`, data);
  return response.data as UserOut;
}

/**
 * Sends the user's onboarding answers to the backend, which asks the AI to
 * compute their daily calorie target and persists the metrics to the
 * `metrics` table for the given Clerk user.
 *
 * Returns the saved metrics row.
 */
export async function saveUserOnboarding(
  data: OnboardingData,
  clerkId: string
): Promise<MetricsOut> {
  if (!data.exerciseLevel || !data.goal) {
    throw new Error(
      "Cannot save onboarding: exercise level and goal are required"
    );
  }
  const response = await axios.post(`${BASE_URL}/meals/onboarding`, {
    height: Number(data.height),
    weight: Number(data.weight),
    age: Number(data.age),
    exerciseLevel: data.exerciseLevel,
    goal: data.goal,
    clerk_id: clerkId,
  });
  return response.data as MetricsOut;
}

/**
 * PUT /meals/metrics — sends the updated metrics back to the AI so the daily
 * calorie target is recalculated from the new values/goal, then persists them.
 *
 * Returns the updated metrics row.
 */
export async function updateUserMetrics(
  input: MetricsUpdateInput,
  clerkId: string
): Promise<MetricsOut> {
  const response = await axios.put(`${BASE_URL}/meals/metrics`, {
    ...input,
    clerk_id: clerkId,
  });
  return response.data as MetricsOut;
}

/**
 * GET /meals/history — meals + calorie target for a date range.
 *
 * `start`/`end` are ISO instants: the app sends the local-midnight instant of
 * the week's Monday for `start` and of the FOLLOWING Monday for `end`
 * (exclusive), produced with `date.toISOString()`. The backend filters on the
 * exact UTC instants while the app groups meals by their local day.
 */
export async function getMealHistory(
  clerkId: string,
  start: Date,
  end: Date
): Promise<HistoryResponse> {
  const response = await axios.get(`${BASE_URL}/meals/history`, {
    params: {
      clerk_id: clerkId,
      start: start.toISOString(),
      end: end.toISOString(),
    },
  });
  return response.data as HistoryResponse;
}

/** GET /meals/{id} — fetches a single meal by its database id. */
export async function getMealById(mealId: number): Promise<MealOut> {
  const response = await axios.get(`${BASE_URL}/meals/${mealId}`);
  return response.data as MealOut;
}

/** DELETE /meals/{id} — deletes a single meal by its database id. */
export async function deleteMeal(mealId: number): Promise<void> {
  await axios.delete(`${BASE_URL}/meals/${mealId}`);
}

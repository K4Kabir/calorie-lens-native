import Constants from "expo-constants";
import axios, { type AxiosRequestConfig } from "axios";
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

// Prints the resolved backend URL to the Metro / Expo Go console so it's easy
// to confirm which backend the app is actually talking to (dev only).
if (__DEV__) {
  console.log("[API] BASE_URL =", BASE_URL);
}

/**
 * Shared axios instance. The 60s timeout matters for Render's free tier:
 * a sleeping instance can take up to ~50s to wake up on the first request
 * (axios's default is "wait forever", which just looks like a hang).
 */
const http = axios.create({ timeout: 60_000 });

type RequestConfig = AxiosRequestConfig & {
  /**
   * Retry once when the request comes back 404. Pass true only where a 404
   * can never be a legitimate response (e.g. create-or-get calls) — Render's
   * edge occasionally answers the first request with 404 while the free-tier
   * instance is still waking up, and the retry then succeeds.
   */
  retryOn404?: boolean;
};

/** Single request with one automatic retry on transient failures. */
async function request<T>(config: RequestConfig): Promise<T> {
  const { retryOn404 = false, ...axiosConfig } = config;

  const attempt = async () => (await http.request<T>(axiosConfig)).data;

  try {
    return await attempt();
  } catch (err) {
    const retriable =
      axios.isAxiosError(err) &&
      (err.code === "ECONNABORTED" || // timeout
        err.code === "ERR_NETWORK" || // connection failed / refused
        (err.response?.status ?? 0) >= 500 || // server error
        (retryOn404 && err.response?.status === 404)); // cold-start 404

    if (!retriable) throw err;

    // Brief pause so a waking instance can finish booting before retrying.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return attempt();
  }
}

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

/** Mirrors the backend MealAnalyzeResponse from POST /meals/analyze. */
export type MealAnalysisResult = {
  title: string;
  description?: string | null;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
};

/** Payload of POST /meals/create — persists an already-analyzed meal. */
export type MealCreateInput = {
  title: string;
  description: string;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
  user_id: number;
};

/**
 * React Native's FormData accepts `{ uri, name, type }` objects as file parts.
 * The photo is uploaded as raw binary (multipart), never base64.
 */
function photoFormPart(photoUri: string): {
  uri: string;
  name: string;
  type: string;
} {
  return { uri: photoUri, name: "meal.jpg", type: "image/jpeg" };
}

/* -------------------------------- Endpoints -------------------------------- */

/**
 * POST /users/check — ensures the Clerk user exists in the backend and returns
 * the full user (with their single `metric`, if onboarding is complete).
 */
export async function checkUser(data: CheckUserInput): Promise<UserOut> {
  return request<UserOut>({
    method: "post",
    url: `${BASE_URL}/users/check`,
    data,
    retryOn404: true,
  });
}

/**
 * POST /meals/analyze — uploads the meal photo as multipart binary to the AI,
 * which returns the estimated meal data (title, macros, kcal) without saving.
 *
 * `description` is an optional note from the user about the meal (cooking
 * method, portion, ingredients, ...); when provided, the AI refines the
 * analysis using both the photo and this description.
 */
export async function analyzeMealImage(
  photoUri: string,
  description?: string
): Promise<MealAnalysisResult> {
  const form = new FormData();
  form.append("image", photoFormPart(photoUri) as unknown as Blob);
  const trimmed = description?.trim();
  if (trimmed) {
    form.append("description", trimmed);
  }
  return request<MealAnalysisResult>({
    method: "post",
    url: `${BASE_URL}/meals/analyze`,
    data: form,
  });
}

/**
 * POST /meals/create — persists an analyzed meal. Meal fields are sent as
 * multipart form data and the photo (if any) as a raw binary file; the
 * backend uploads it to Cloudinary and stores only the URL in the DB.
 *
 * Returns the saved meal row (with the Cloudinary image URL, if any).
 *
 * Note: retryOn404 is intentionally NOT set — retrying a create that already
 * succeeded would insert a duplicate meal row.
 */
export async function createMeal(
  data: MealCreateInput,
  photoUri: string | null
): Promise<MealOut> {
  const form = new FormData();
  if (photoUri) {
    form.append("image", photoFormPart(photoUri) as unknown as Blob);
  }
  form.append("title", data.title);
  form.append("description", data.description);
  form.append("time", data.time);
  form.append("protein", String(data.protein));
  form.append("carbs", String(data.carbs));
  form.append("fat", String(data.fat));
  form.append("kcal", String(data.kcal));
  form.append("user_id", String(data.user_id));
  return request<MealOut>({
    method: "post",
    url: `${BASE_URL}/meals/create`,
    data: form,
  });
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
  return request<MetricsOut>({
    method: "post",
    url: `${BASE_URL}/meals/onboarding`,
    data: {
      height: Number(data.height),
      weight: Number(data.weight),
      age: Number(data.age),
      exerciseLevel: data.exerciseLevel,
      goal: data.goal,
      clerk_id: clerkId,
    },
    retryOn404: true,
  });
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
  return request<MetricsOut>({
    method: "put",
    url: `${BASE_URL}/meals/metrics`,
    data: { ...input, clerk_id: clerkId },
    retryOn404: true,
  });
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
  return request<HistoryResponse>({
    method: "get",
    url: `${BASE_URL}/meals/history`,
    params: {
      clerk_id: clerkId,
      start: start.toISOString(),
      end: end.toISOString(),
    },
    retryOn404: true,
  });
}

/** GET /meals/{id} — fetches a single meal by its database id. */
export async function getMealById(mealId: number): Promise<MealOut> {
  return request<MealOut>({
    method: "get",
    url: `${BASE_URL}/meals/${mealId}`,
  });
}

/** DELETE /meals/{id} — deletes a single meal by its database id. */
export async function deleteMeal(mealId: number): Promise<void> {
  await request<void>({
    method: "delete",
    url: `${BASE_URL}/meals/${mealId}`,
  });
}

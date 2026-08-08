/**
 * Shared macro-goal math for Home (daily) and History (weekly).
 *
 * The BE stores no macro goals — they're estimated from the user's daily
 * `calorie_target` using a 30% protein / 40% carbs / 30% fat split
 * (protein & carbs: 4 kcal/g, fat: 9 kcal/g).
 */

/** Daily macro goals (grams) derived from a daily calorie target. */
export function getDailyMacroGoals(calorieTarget: number) {
  return {
    protein: Math.round((calorieTarget * 0.3) / 4),
    carbs: Math.round((calorieTarget * 0.4) / 4),
    fat: Math.round((calorieTarget * 0.3) / 9),
  }
}

/** Weekly macro goals (grams) — the daily split scaled by 7 days. */
export function getWeeklyMacroGoals(calorieTarget: number) {
  const daily = getDailyMacroGoals(calorieTarget)
  return {
    protein: daily.protein * 7,
    carbs: daily.carbs * 7,
    fat: daily.fat * 7,
  }
}

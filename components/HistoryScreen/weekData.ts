import type { MealOut } from '@/utils/api'
import type { DaySummary, WeekData } from './types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Monday 00:00 local of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * The week shown at `offset` (0 = current, 1 = previous, …) as instant
 * boundaries: `start` = local midnight of Monday, `end` = local midnight of
 * the FOLLOWING Monday (exclusive). Pass both straight to `getMealHistory`.
 */
export function weekRange(offset: number): { start: Date; end: Date } {
  const start = startOfWeek(new Date())
  start.setDate(start.getDate() - offset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

/** 'Mon, Aug 5' style label for the week header. */
function fmt(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** Which of the 7 chart days (Mon-first, 0–6) a meal belongs to, or -1. */
function dayIndexFor(date: Date, monday: Date): number {
  // Compare local calendar dates (not day-diffs) so DST-shortened/lengthened
  // days can never shift a meal into the wrong column.
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    if (date.toDateString() === d.toDateString()) return i
  }
  return -1
}

/**
 * Groups real backend meals into the 7 day summaries the chart renders.
 * Calorie totals and macros are summed from the meal rows; goals are derived
 * from the user's `calorie_target` (the BE stores no macro goals).
 */
export function buildWeekData(
  meals: MealOut[],
  calorieTarget: number,
  offset: number
): WeekData {
  const { start: monday } = weekRange(offset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const today = startOfWeek(new Date())
  const perDay = Array.from({ length: 7 }, () => ({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    count: 0,
  }))

  for (const meal of meals) {
    const date = new Date(meal.created_at)
    if (Number.isNaN(date.getTime())) continue
    const i = dayIndexFor(date, monday)
    if (i < 0) continue
    perDay[i].kcal += meal.kcal
    perDay[i].protein += meal.protein
    perDay[i].carbs += meal.carbs
    perDay[i].fat += meal.fat
    perDay[i].count += 1
  }

  const days: DaySummary[] = perDay.map((sum, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      dayIndex: i,
      dayLabel: DAY_LABELS[i],
      dateLabel: fmt(date),
      fullLabel: `${DAY_NAMES[i]}, ${fmt(date)}`,
      isToday: date.toDateString() === today.toDateString(),
      kcal: sum.kcal,
      protein: sum.protein,
      carbs: sum.carbs,
      fat: sum.fat,
      mealCount: sum.count,
    }
  })

  const totals = days.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
      meals: acc.meals + d.mealCount,
      activeDays: acc.activeDays + (d.kcal > 0 ? 1 : 0),
      onTargetDays: acc.onTargetDays + (d.kcal >= calorieTarget ? 1 : 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, meals: 0, activeDays: 0, onTargetDays: 0 }
  )

  const weekLabel =
    monday.getMonth() === sunday.getMonth()
      ? `${fmt(monday)} – ${sunday.getDate()}, ${sunday.getFullYear()}`
      : `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`
  const rangeLabel = offset === 0 ? 'This week' : offset === 1 ? 'Last week' : `${offset} weeks ago`

  return { weekLabel, rangeLabel, days, totals }
}

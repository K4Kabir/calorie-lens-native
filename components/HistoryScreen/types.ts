export type DaySummary = {
  /** 0 = Monday … 6 = Sunday. */
  dayIndex: number;
  dayLabel: string; // 'Mon'
  dateLabel: string; // 'Aug 5'
  fullLabel: string; // 'Wed, Aug 5'
  isToday: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
};

export type WeekData = {
  weekLabel: string; // 'Aug 3 – 9, 2026'
  rangeLabel: string; // 'This week' | 'Last week' | '2 weeks ago'
  days: DaySummary[];
  totals: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
    activeDays: number;
    onTargetDays: number;
  };
};

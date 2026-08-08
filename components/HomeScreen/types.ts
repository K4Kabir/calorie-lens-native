export type Macro = {
  label: string;
  current: number;
  goal: number;
  color: string;
  trackColor: string;
};

export type Meal = {
  id: number;
  image: string | null;
  title: string;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
};

export type HomeDashboardProps = {
  name: string;
  /** Daily calorie goal from the user's metrics (0 until onboarding). */
  goal: number;
  onCameraPress?: () => void;
};

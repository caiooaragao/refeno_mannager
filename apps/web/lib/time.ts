const TIME_STEP_MINUTES = 30;

export const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / TIME_STEP_MINUTES },
  (_, index) => {
    const totalMinutes = index * TIME_STEP_MINUTES;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
);

export function getTimeOptions(selected?: string): string[] {
  if (!selected || TIME_OPTIONS.includes(selected)) {
    return TIME_OPTIONS;
  }

  return [...TIME_OPTIONS, selected].sort();
}

export function getEndTimeOptions(inicio: string, fim?: string): string[] {
  const baseOptions = getTimeOptions(fim).filter((time) => !inicio || time > inicio);

  if (fim && !baseOptions.includes(fim)) {
    return [...baseOptions, fim].sort();
  }

  return baseOptions;
}

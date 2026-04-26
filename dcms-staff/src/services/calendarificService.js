const CALENDARIFIC_BASE_URL = 'https://calendarific.com/api/v2/holidays'

const resolveCalendarificApiKey = (providedKey) => {
  const runtimeKey = providedKey || process.env.EXPO_PUBLIC_CALENDARIFIC_API_KEY
  return String(runtimeKey || '').trim()
}

export const fetchPhilippineHolidays = async ({ year = 2026, apiKey } = {}) => {
  const resolvedApiKey = resolveCalendarificApiKey(apiKey)

  if (!resolvedApiKey || resolvedApiKey === 'YOUR_API_KEY') {
    throw new Error('Calendarific API key is missing. Set EXPO_PUBLIC_CALENDARIFIC_API_KEY.')
  }

  const queryParams = new URLSearchParams({
    api_key: resolvedApiKey,
    country: 'PH',
    year: String(year),
  })

  const response = await fetch(`${CALENDARIFIC_BASE_URL}?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error('Unable to fetch holidays from Calendarific.')
  }

  const payload = await response.json()
  const holidays = Array.isArray(payload?.response?.holidays) ? payload.response.holidays : []

  // Calendarific returns ISO date-time values. Keep only YYYY-MM-DD for quick matching.
  return holidays
    .map((holiday) => String(holiday?.date?.iso || '').slice(0, 10))
    .filter(Boolean)
}

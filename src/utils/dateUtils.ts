export const dateFormated = (date?: Date | string): string => {
  date = date
    ? new Date(date)
    : new Date()

  let weekDay = date.toLocaleDateString(window.navigator.language, { weekday: 'long' })

  weekDay = `${weekDay.charAt(0).toUpperCase()}${weekDay.slice(1)}`

  return `${weekDay} ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`
}
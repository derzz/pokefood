export function formatDisplayName(name: string): string {
  return name
    .trim()
    .split(/([\s_-]+)/)
    .map((segment) => {
      if (/^[\s_-]+$/.test(segment)) {
        return segment
      }

      return segment
        .split('/')
        .map((part) => {
          if (!part) {
            return part
          }

          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join('/')
    })
    .join('')
}
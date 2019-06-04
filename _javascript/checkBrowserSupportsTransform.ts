export function checkBrowserSupportsTransform(): boolean {
  const prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ')
  const div = document.createElement('div')

  for (const prefix of prefixes) {
    if (div && typeof div.style[prefix] !== 'undefined') {
      return true
    }
  }

  return false
}

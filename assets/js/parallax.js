// TODO: Maybe tacky? Decide if I actually wanna keep this.
// TODO: If yes - then optimise some of the redundant calcs, and maybe
//       stick CSS updates behind requestAnimationFrame(). 
class Parallax {
  constructor(containerElem) {
    this.scale = 1.2
    this.visible = true
    this.containerElem = containerElem
    this.imageElem = containerElem.querySelector('img')

    this.observer = new IntersectionObserver((entries) =>
      this.handleIntersection(entries)
      , {
        root: null,
        rootMargin: '0px',
        threshold: [0, 1],
      })

    this.imageElem.style.transform = `scale(${this.scale})`
    this.containerElem.style.overflow = 'hidden'

    document.addEventListener('scroll', () => this.draw())
    window.addEventListener('resize', () => this.draw())
    this.draw()
  }

  start() {
    this.observer.observe(this.containerElem)
  }

  handleIntersection(entries) {
    for (let entry of entries) {
      if (entry.intersectionRatio > 0) {
        this.visible = true
      } else {
        this.visible = false
      }
    }
  }

  draw() {
    if (!this.visible) { return }

    const box = this.containerElem.getBoundingClientRect()
    const elementTop = box.top + window.scrollY
    const progress = Math.max(0, Math.min(1, box.bottom / (box.height + elementTop)))
    const range = (box.height * this.scale) - box.height
    const translateAmount = ((progress * range) - (range / 2)).toFixed()

    this.imageElem.style.transform = `translate3d(0, ${translateAmount}px, 0) scale(${this.scale})`
  }
}

const elems = document.querySelectorAll('[data-parallax]')

for (let elem of elems) {
  const p = new Parallax(elem)
  p.start()
}

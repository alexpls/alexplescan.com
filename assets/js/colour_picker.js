const container = document.querySelector('.colour-picker-container')
const thumb = document.querySelector('.colour-picker-thumb')
const choices = document.querySelectorAll('.colour-picker-choices [role="radio"]')

const choiceValues = ['light', 'system', 'dark']

let pos = 0

if (localStorage.theme) {
  pos = choiceValues.indexOf(localStorage.theme)
}

function advance() {
  pos = (pos + 1) % choices.length
}

function update() {
  localStorage.theme = choiceValues[pos]
  window.updateTheme()

  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i]

    if (i === pos) {
      choice.setAttribute('aria-checked', 'true')
    } else {
      choice.removeAttribute('aria-checked')
    }
  }

  thumb.style.transform = `translateX(${pos * (thumb.clientWidth + 1)}px)`
}

container.addEventListener('click', () => {
  advance()
  update()
})

for (let i = 0; i < choices.length; i++) {
  const choice = choices[i];

  (i => {
    choice.addEventListener('keydown', (event) => {
      switch (event.code) {
        case "Space":
        case "Enter":
          pos = i
          update()
          event.stopPropagation()
          event.preventDefault()
          break
      }
    })
  })(i)
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', _ => {
  window.updateTheme()
})

// Don't jank the thumb into position when the page loads.
thumb.classList.remove('transition-transform')
setTimeout(() => {
  thumb.classList.add('transition-transform')
}, 20)

container.dataset.loaded = 'true'
update()


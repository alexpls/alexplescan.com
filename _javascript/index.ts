import * as LazyLoad from 'vanilla-lazyload'
import { checkBrowserSupportsTransform } from './checkBrowserSupportsTransform';

window.addEventListener('load', () => {
  new LazyLoad({
    elements_selector: '.lazy',
    threshold: 0
  })

  if (checkBrowserSupportsTransform()) {
    document.body.classList.add('supports-transform')
  }
})

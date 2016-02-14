(function() {

  "use strict";

  function checkBrowserSupportsTransform() {
    var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
    var div = document.createElement('div');

    for (var i = 0; i < prefixes.length; i++) {
      var prefix = prefixes[i];
      if (div && typeof div.style[prefix] !== 'undefined') {
        return true;
      }
    }

    return false;
  };

  if (checkBrowserSupportsTransform()) {
    document.body.classList.add('supports-transform');
  }

})();

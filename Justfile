build:
	npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css
	hugo
	cp _redirects public/_redirects

watch-tailwind:
  npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch

watch-hugo:
  hugo server --buildDrafts --bind "0.0.0.0"

dev:
  #!/usr/bin/env -S parallel --shebang --ungroup
  just watch-tailwind
  just watch-hugo


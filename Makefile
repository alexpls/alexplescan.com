.PHONY: build
build:
	npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css
	hugo

.PHONY: watch-tailwind
watch-tailwind:
	npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch

.PHONY: watch-hugo
watch-hugo:
	hugo server --bind "0.0.0.0"


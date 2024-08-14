.PHONY: build
build:
	npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css
	hugo

.PHONY: tailwind-watch
tailwind-watch:
	npx tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch

.PHONY: hugo-watch
hugo-watch:
	hugo server


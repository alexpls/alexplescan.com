build:
	hugo
	cp _redirects public/_redirects

dev:
  hugo server --buildDrafts --bind "0.0.0.0"


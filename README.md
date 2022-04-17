# [alexplescan.com](https://alexplescan.com)

This is the Jekyll repository for my site [alexplescan.com](https://alexplescan.com).

No license here, so if any of this code is of use to you - take it and use it however you want!

## Installation

```
# Install ruby
$ brew install rbenv
$ rbenv install
# or, if on an M1 Mac
RUBY_CFLAGS="-w" rbenv install 2.7.1

$ brew install git-lfs vips
$ bundle
```

## Dev server

```
$ bundle exec jekyll serve --config "_config.yml,_config_dev.yml"
```

## Notes

**Need to use Ruby v2.7.1**

This is due to [Cloudflare Pages not supporting more recent versions of Ruby](https://community.cloudflare.com/t/pages-ruby-3-x-is-not-available/369721). Once they add support, I should upgrade to Ruby v3+.

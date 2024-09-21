+++
title = "Rebuilding this site"
date = 2024-09-21T15:52:32+10:00
description = "Discusses the ground-up rebuild of this site, using Hugo, and Tailwind CSS, and more."
tags = ['Web']
+++

It's been eight years since I first made this site, and since then it hasn't had any substantial updates to its design or overall structure. Here we are now in 2024, and I find myself to be a developer with a blog that _doesn't_ have a dark theme... what set out as an effort to rectify this embarrassing fact with some simple CSS tweaks ended up being a rewrite of the entire site. Oh well - guess I love to shave yaks!

This post runs through some of the new things I'm doing with this site from a technical point of view, as well as some things that I've decided not to change from the old one.

For posterity (and my own nostalgia), the old website has been archived at [v1.alexplescan.com](https://v1.alexplescan.com). This site's source code is available at [alexpls/alexplescan.com](https://github.com/alexpls/alexplescan.com), so if you want to dig in to anything I talk about here in more detail - help yourself!

## Using Hugo

The biggest change I made was migrating from Jekyll to Hugo. This was a tough choice to make, I still have a soft spot for Jekyll, have built a number of sites in it, and still find it generally more intuitive, but there were a few things about Hugo that swayed me over...

### Hugo seems easier to maintain

Hugo cuts down on a lot of dependency management work by shipping as a single binary. Jekyll on the other hand is distributed as a Ruby gem... this means that in order to build my site in Jekyll I've gotta manage Ruby versions, gems, and system dependencies. Often I'll take long breaks between updates to this site, and with Jekyll when I'd jump in to make a change for the first time in a while I'd find myself spending a bit of time just getting the build working again. I am hoping that with Hugo I'll have a bit more stability in this respect.

There's also a bunch of stuff built-in to Hugo that I previously had to use Jekyll plug-ins for (RSS feed, sitemap generation, pagination, responsive images). With the new site my *only* dependency is Hugo - which makes me very happy.

Of course, at this stage my hope that Hugo will be easier to maintain is just conjecture... let's check in in another eight years and see if I was right :)

### Hugo builds are faster

Without any caching, my Jekyll site would build in about eleven seconds, the Hugo one builds in about six. With caching, Jekyll rebuilds in 700ms, Hugo in 100ms. Neither are slow enough to be a real blocker while I'm working on the site... but faster _is_ better.

### Hugo's templating is more flexible (albeit it's also uglier)

Jekyll uses the Liquid templating language, whereas Hugo uses Go templates. As a quick comparison between the two, let's see what it looks like to render out a comma separated list of pages:

In Liquid:

```text
{% for page in pages %}
  <a href="{{ page.url }}">{{ page.title }}</a>
  {% if forloop.last %}
	.
  {% else %}
	,
  {% endif %}
{% endfor %}
```

And in Go templates:

```go-html-template
{{ $length := (len .Pages) }}
{{ range $index, $page := .Pages }}
  <a href="{{ .RelPermalink }}">{{ .Title }}</a>
  {{ if eq (add $index 1) $length }}
	.
  {{ else }}
	,
  {{ end }}
{{ end }}
```

It took me a while to get used to the Go templates' functional pipeline syntax and lack of native operators. From the example above, I would've preferred to write `if $index + 1 == $length` instead of `if eq (add $index 1) $length`.

There're also more conveniences in Liquid that make it a generally friendlier templating language (take the `forloop.last` helper for example).

On the flipside, Go templates are more powerful and flexible, so suit complex scenarios better. I'll cover an example of this in more detail under the [Responsive images](#responsive-images) heading below. All things considered, I think the tradeoff has been worth it.

## Using Tailwind CSS

This rewrite was also a good opportunity to use Tailwind CSS (the old site used SCSS stylesheets). I experimented with Tailwind when I first built [Mailgrip](https://mailgrip.io) and I was immediately hooked - I don't see myself starting any new web project without it.

It strikes the perfect balance between being flexible enough to feel like you can write custom CSS for everything, while still giving defaults that look good in any environment (colour palettes, spacing, typography rules, responsive layouts, etc). Plus its approach of styling with utility classes right in HTML, as weird as it first was to get used to, is extremely productive.

A downside to using Tailwind with Hugo is that my build now has two steps. One to generate Tailwind's CSS, and one to build the Hugo site. This should hopefully get stamped down into one step once Tailwind 4 is released and Hugo's built-in [`css.TailwindCSS` processor](https://gohugo.io/functions/css/tailwindcss/) is ready for general usage.

## Adding a dark theme

Step 0 of creating a developer blog in 2024 is adding a dark theme, so this site has one now. Tailwind CSS made this really easy with its built-in dark mode selectors and [colour palettes](https://tailwindcss.com/docs/customizing-colors). I went for "Slate" for the dark theme, and "Zinc" for the light theme.

Visitors can choose between three theme options: System, Dark, and Light. I like to use native HTML controls as much as possible, but after experimenting with a few I couldn't find any that really looked nice in this case. As such, I made a custom control for toggling between the themes. A sprinkling of ARIA attributes helped make it accessible by keyboard and screen reader.

## Responsive images

Images are available at variable quality levels depending on the screen the website is being viewed on and how modern a visitor's browser is. On a mobile display, a lower resolution image will be loaded - whereas on a high-DPI desktop visitors get a higher res image. Modern browsers get more efficient WebP images. Older ones get JPEGs.

With Jekyll I was using [jekyll_picture_tag](https://github.com/rbuchberger/jekyll_picture_tag) for this. Hugo's got image processing functionality built in, so for the new site I've used that.

I took inspiration from [Bryce Wray's post](https://www.brycewray.com/posts/2022/06/responsive-optimized-images-hugo/) and created a shortcode to handle responsive image generation. This ends up looking like this in a template:

```markdown
{{</* image src="08_status_bar.png" alt="screenshot of WezTerm with a right status bar showing the system's hostname" class="ap-post-img" */>}}
```

and produces HTML that looks like this:

```html
<picture>
  <source type="image/webp" srcset="/posts/2024/08/10/wezterm/08_status_bar_hu4260704181743966047.webp, /posts/2024/08/10/wezterm/08_status_bar_hu13694828537407067836.webp 2x" />
  <source type="image/jpeg" srcset="/posts/2024/08/10/wezterm/08_status_bar_hu9862889464567697310.jpg, /posts/2024/08/10/wezterm/08_status_bar_hu3429514080672963904.jpg 2x" />
  <img src="/posts/2024/08/10/wezterm/08_status_bar_hu3699262374842627327.jpg" alt="screenshot of WezTerm with a right status bar showing the system&#39;s hostname" class="ap-post-img" />
</picture>
```

So, that single image ends up being converted into five:
- 2 x WebP (low-res and high-res)
- 2 x JPEG (low-res and high-res)
- Fallback JPEG, in case the browser is too old to support responsive images

The shortcode's implementation looks like:

```go-html-template
{{- /* layouts/shortcodes/image.html */ -}}

{{- $src := .Get "src" -}}
{{- $alt := .Get "alt" | default "" -}}
{{- $quality := .Get "quality" | default "60" -}}
{{- $class := .Get "class" -}}
{{- $desiredWidth := .Get "width" -}}
{{- $width := $desiredWidth | default "760" -}}
{{- $width = int $width -}}
{{- $img := .Page.Resources.Get $src -}}
{{- $fallbackImg := $img.Process (print "resize " $width "x jpg") -}}

{{- $variants := slice
  (dict "type" "webp" "contentType" "image/webp")
  (dict "type" "jpg" "contentType" "image/jpeg")
-}}

{{- $dpiMultipliers := slice 1 -}}
{{- range slice 2 3 -}}
  {{- $multipliedWidth := mul $width . -}}
  {{- if lt $multipliedWidth $img.Width -}}
    {{- $dpiMultipliers = $dpiMultipliers | append . -}}
  {{- end -}}
{{- end -}}

<picture>
  {{- range $variant := $variants -}}
    <source type="{{ $variant.contentType }}" srcset="
      {{- range $i, $multiplier := $dpiMultipliers -}}
        {{- $multipliedWidth := mul $width $multiplier -}}
        {{- if $i }}, {{ end -}}
        {{- ($img.Process (print "resize " $multipliedWidth "x " $variant.type " q" $quality)).RelPermalink -}}
        {{- if ne $multiplier 1 -}}
          {{- print " " $multiplier "x" -}}
        {{- end -}}
      {{- end -}}
    " />
  {{- end -}}
  <img src="{{ $fallbackImg.RelPermalink }}" alt="{{ $alt }}"{{ if $class }} class="{{ $class }}"{{ end }} />
</picture>
{{- /* swallow trailing newline */ -}}
```

A downside of this approach is that I couldn't find an easy way to 

## Deploying to Cloudflare pages

Like the old one, this new site is still deployed to [Cloudflare Pages](https://pages.cloudflare.com/). I've got romantic ideas about one day hosting it on my own home server, but so far Cloudflare's been making deployments too easy, cheap, and reliable for me to bother.

When I push to the master branch of the site, Cloudflare checks out the latest version of the repo, builds it, and deploys it to their network. I already host my DNS with Cloudflare, so this ends up being a near zero configuration setup that just works.

## Analytics with Plausible

I'm still using [Plausible Analytics](https://plausible.io) to track views on the site. I like that they're a small bootstrapped company delivering a focused and high quality product, and I like their strong stance on privacy. Their tracking Javascript respects a visitors' do not track settings, doesn't use cookies, and doesn't gather any personally identifying information. This means that I don't need to have a dreaded "Please accept cookies" banner on the site to be GDPR compliant.

## Lato font

Lato remains as the font for this site. Along with other visual changes made, I thought it'd be interesting to find a new font as well... but I didn't end up finding a (free) one that I liked as much as Lato... what I did find however is [Font Squirrel](https://www.fontsquirrel.com/) - which is a great site for finding free fonts that you can self-host.

## Conclusion

Did I really need to rebuild this site? Nah - the 2016 one still had plenty of life in it. I attribute this to sticking with standard web technologies and keeping things simple. Was it fun to rebuild this site though? Yeah.

What's next? Writing more posts, ideally. And I think my custom Hugo theme is a bit dry at the moment. I'll probably look into doing something to make it more colourful.

+++
date = '2023-07-08T00:00:00Z'
description = 'Using SVG to easily create sparkline charts, and rendering them on the server side with Elixir and Phoenix.'
image = 'assets/posts/easy-svg-sparklines/cover.jpg'
title = 'Easy SVG sparklines'
tags = ['Web']
+++

[Sparkline charts](https://en.wikipedia.org/wiki/Sparkline) are compact, simple charts showing a general trend without getting into the nitty-gritty of a more complete solution.

On [Mailgrip](https://mailgrip.io), I use them as a UI flourish to give a visual indication of how many emails an inbox has received over time:

{{< image src="mailgrip-sparkline.png" alt="a screenshot showing an example of a sparkline" width="500" class="ap-post-img" >}}

This post will explain how to use SVG to create minimal sparklines in a really easy and fast way.

## Hand crafting the SVG

Let's start by writing the SVG by hand, and then I'll show you an example of the Elixir code I use to generate sparklines in Mailgrip.

Say we've got this series of 10 data points to display:

```
1, 0, 5, 4, 8, 10, 15, 10, 5, 4
```

### Drawing a line

Everything has a starting point, including our sparkline. So let's begin by drawing a line.

SVGs use a set of primitive commands ([docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands)) to draw shapes. The ones we're interested in are:

- M (`moveto`): Sets a new starting point. It takes two parameters: X and Y.
- L (`lineto`): Draws a line from the current position to a new one, specified by X and Y parameters.
- Z (`closepath`): Draws a line from the current position back to the starting position.

We'll use these commands to draw our lines based on X and Y coordinates.

In SVG, the origin coordinates (0, 0) are at the top left. However we want our chart's coordinates to start at the bottom left.

To adjust the Y position for a point, we'll substract it from the largest (max) point in our data set. This flips our Y positions to:

```
14, 15, 10, 11, 7, 5, 0, 5, 10, 11
```

Figuring out the X positions is straightforward; they're just the index of the point we're drawing:

```
0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

Now, let's put these coordinates to work and draw our sparkline:

```html
<svg height="180px" width="500px">
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke-width="2"
    stroke="red"
    fill="transparent"
  />
</svg>
```

Behold our beautiful creation:

<div>
  <svg
    height="180px"
    width="500px"
    class="ap-post-img"
  >
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke-width="2"
      stroke="red"
      fill="transparent" />
  </svg>
</div>

Okay that's a bit sad, we've got a few more steps to go still...

### Scaling

We've defined that our SVG should have a height of 180px and width of 500px, but the line we drew is rendering at one pixel per X/Y coordinate.

Here's where SVG's ability to _Scale_ Vector Graphics really helps out. Instead of having to transpose our data to screen space coordinates, we can let SVG do it for us!

We use the `viewBox` attribute ([docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)) on the SVG element to set the coordinate space of the chart. `viewBox` values are zero-indexed, so our width will be `9` (because we have a total of 10 points) and our height will be `15` (because our max point value is 15).

```html
<svg height="180px" width="500px" viewBox="0 0 9 15">
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke-width="2"
    stroke="red"
    fill="transparent"
  />
</svg>
```

<div>
  <svg
    height="180px"
    width="500px"
    viewBox="0 0 9 15"
    class="ap-post-img"
  >
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke-width="2"
      stroke="red"
      fill="transparent" />
  </svg>
</div>

Ah, but now a couple of other funky things have happened:

- The `stroke-width` of 2px has scaled up with the image. We can tell SVG to keep the stroke consistent by setting the `vector-effect` ([docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/vector-effect)) property on our path.
- The image scaled up using the aspect ratio of the 9 x 15 `viewBox`, which is different to that of our image. We can tell SVG to maintain the aspect ratio of the `svg` element by setting `preserveAspectRatio` to `none` ([docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio)).

```html
<svg height="180px" width="500px" viewBox="0 0 9 15" preserveAspectRatio="none">
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke-width="2"
    stroke="red"
    fill="transparent"
    vector-effect="non-scaling-stroke"
  />
</svg>
```

<div>
  <svg
    height="180px"
    width="500px"
    viewBox="0 0 9 15"
    preserveAspectRatio="none"
    class="ap-post-img"
  >
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke-width="2"
      stroke="red"
      fill="transparent"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</div>

That's better, now for some more... flare... let's add a fill to the SVG as well:

### Adding a fill

To do this, we copy our existing line but set a `fill` on it instead of a `stroke`:

```html
<svg height="180px" width="500px" viewBox="0 0 9 15" preserveAspectRatio="none">
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke="transparent"
    fill="pink"
  />
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke-width="2"
    stroke="red"
    fill="transparent"
    vector-effect="non-scaling-stroke"
  />
</svg>
```

<div>
  <svg
    height="180px"
    width="500px"
    viewBox="0 0 9 15"
    preserveAspectRatio="none"
    class="ap-post-img"
  >
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke="transparent"
      fill="pink"
    />
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke-width="2"
      stroke="red"
      fill="transparent"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</div>

Almost there! Let's close that unsightly white gap. To do so, we need to extend our line to the bottom right of the graphic (`L 9 15`), then to the bottom left (`L 0 15`), then back up to the starting point (`Z`).

This creates a closed line that nicely encapsulates the area we want to fill in:

```html
<svg height="180px" width="500px" viewBox="0 0 9 15" preserveAspectRatio="none">
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11 L 9 15 L 0 15 Z"
    stroke="transparent"
    fill="pink"
  />
  <path
    d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
    stroke-width="2"
    stroke="red"
    fill="transparent"
    vector-effect="non-scaling-stroke"
  />
</svg>
```

<div>
  <svg
    height="180px"
    width="500px"
    viewBox="0 0 9 15"
    preserveAspectRatio="none"
    class="ap-post-img"
  >
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11 L 9 15 L 0 15 Z"
      stroke="transparent"
      fill="pink"
    />
    <path
      d="M 0 14 L 1 15 L 2 10 L 3 11 L 4 7 L 5 5 L 6 0 L 7 5 L 8 10 L 9 11"
      stroke-width="2"
      stroke="red"
      fill="transparent"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</div>

That's looking pretty good now - especially considering how simple it was to draw. Now let's move on to rendering these on the server...

## Rendering Sparklines on the server

One of my favourite things about creating sparklines like this is that I can create the SVGs entirely on the backend. I don't need to worry about using a JavaScript charting library, or sending the "points" data to the frontend. The browser requests an SVG. The server returns it. Simple!

Mailgrip is written in Elixir and uses the Phoenix framework, so the code I'm sharing is in Elixir too - but this approach could be adapted to any programming language.

The Phoenix controller defines a route that looks like:

```elixir
defmodule MailgripWeb.InboxController do
  def activity_svg(conn, _params) do
    points =
      Emails.message_stats(conn.assigns.inbox, 30)
      |> Enum.map(fn stat -> Map.fetch!(stat, :count) end)

    conn
    |> put_resp_content_type("image/svg+xml")
    |> send_resp(200, MailgripWeb.Sparkline.draw(100, 20, points))
  end
end
```

Which in turn calls this module (heavily inspired by the [ContEx](https://github.com/mindok/contex) package):

```elixir
defmodule MailgripWeb.Sparkline do
  @fill "#dcfce7"
  @stroke "#bbf7d0"
  @stroke_width 4

  def draw(width, height, points) do
    vb_width = length(points) - 1
    vb_height = Enum.max(points)

    """
    <svg height="#{height}" width="#{width}" viewBox="0 0 #{vb_width} #{vb_height}" preserveAspectRatio="none" role="img" xmlns="http://www.w3.org/2000/svg">
      <path d="#{closed_path(points, vb_width, vb_height)}" stroke="transparent" fill="#{@fill}" />
      <path d="#{path(points, vb_width, vb_height)}" stroke-width="#{@stroke_width}" vector-effect="non-scaling-stroke" stroke="#{@stroke}" fill="transparent" />
    </svg>
    """
  end

  defp path(points, vb_width, vb_height) do
    [
      "M",
      points
      |> Enum.with_index()
      |> Enum.map(fn {value, i} ->
        x = i
        y = vb_height - value
        "#{x} #{y}#{if i < vb_width, do: " L "}"
      end)
    ]
  end

  defp closed_path(points, vb_width, vb_height) do
    [path(points, vb_width, vb_height), " L #{vb_width} #{vb_height} L 0 #{vb_height} Z"]
  end
end
```

That's all it takes for minimal sparklines to add some flourish to your user interfaces!

My use of sparklines is gonna go:

<div>
  <svg
    height="180px"
    width="500px"
    viewBox="0 0 10 50"
    preserveAspectRatio="none"
    class="ap-post-img"
  >
    <path
      d="M 0 50 L 1 49 L 2 49 L 3 48 L 4 47 L 5 44 L 6 43 L 7 42 L 8 35 L 9 22 L 10 0 L 10 50 L 0 50 Z"
      stroke="transparent"
      fill="pink"
    />
    <path
      d="M 0 50 L 1 49 L 2 49 L 3 48 L 4 47 L 5 44 L 6 43 L 7 42 L 8 35 L 9 22 L 10 0"
      stroke-width="2"
      stroke="red"
      fill="transparent"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</div>

---

**Edit 15 July 2023:** See [Timeseries with PostgreSQL](/posts/2023/07/15/postgres-timeseries/) for an addendum re. how the timeseries data is generated.


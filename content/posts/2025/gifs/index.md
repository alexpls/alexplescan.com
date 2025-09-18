+++
date = '2025-09-15T18:57:00+1000'
title = 'Just for fun: animating a mosaic of 90s GIFs'
description = 'How I built a scrolling GIF mosaic for Battle of the Tech Bands: p5.js/WebGL, CRT shader, perceptual hashing, and NSFW filtering on GeoCities classics'
image = 'cover.jpg'
tags = ['Web']
+++

A couple of weeks ago, my [former colleagues](https://www.fortherecord.com/) competed in Brisbane’s Battle of the Tech Bands - and won! I created visuals for six of their songs, which were mostly 90s/2000s covers. It felt only right to theme the visuals around that era too.

Here's how one of my favourites turned out (fittingly for a tech themed battle, it's rendered entirely in-browser):

<iframe src="https://gifs.alex.works" title="GIFs mosaic" class="ap-post-img w-full h-[500px] max-h-[100vh]" loading="lazy"></iframe>

(Fullscreen at [gifs.alex.works](https://gifs.alex.works))

What you're seeing is a Canvas animation of random old-school GIFs, pulled from the [Internet Archive’s GeoCities collection](https://archive.org/web/geocities.php), stitched into a scrolling mosaic, and finished off with a CRT shader.

Here's what it looked like on the night:

{{< image src="band.jpg" class="ap-post-img" >}}

Making this was a fun nostalgic trip. GeoCities is where I published my first websites when I was just a little Alex. One was a blog and the other was a collection of my favourite ROMs. Those are long lost, but seeing these GIFs brought me back to what it was like to discover the web for the first time, and sow the seeds for what'd become both my career and hobby.

So, let's go behind the scenes of how the GIF mosaic came together. We'll look at sourcing the GIFs, cleaning them up so they're safe for public display, and animating them.

The code snippets along the way are terse on purpose. They skip things like error handling - so you'll probably wanna harden them before using them on anything serious.

Let's get into it!

## Downloading

{{< tiled-bg src="downloading.gif" >}}

Big thanks to the Internet Archive for [preserving GeoCities](https://blog.archive.org/2009/08/25/geocities-preserved/) (and its GIFs!) The process for downloading them looked something like:

1. Define a list of keywords that I thought would make for good GIFs (e.g. music, dancing, movie, band, cat, fun, party)
2. For each keyword
	1. Query the Archive's APIs to retrieve related GIFs
	2. For each GIF
		1. Download it!
		2. Sleep for 2 seconds so as to stay within the Archive's rate limits

Although their APIs and licensing are permissive, I don't think it's appropriate to share what amounts to a scraper script, but trust me - it's not hard to implement. Check out the [official Archive APIs](https://archive.org/developers/index-apis.html) for inspiration.

After a couple of days of downloading, I had 60,000+ GIFs to play with, so let's play...

## Sanitising

Guess what happens when you download a random sampling of that many images from the internet? You end up with a lot of duplicates, a lot of photos of cats, and *a lot* of NSFW.

Since these GIFs were gonna be projected on a big screen at a public venue, I didn't wanna risk any of those things showing up, so they had to be cleaned up...

### Removing duplicates

{{< tiled-bg src="twins.gif" >}}

A naive way to compare GIFs and remove duplicates would be to compare their raw byte contents. If the GIFs are identical, their bytes will match exactly. Hashing the file contents makes this comparison more efficient:

```python
import hashlib

def h(path):
  return hashlib.sha256(open(path,'rb').read()).hexdigest()

duplicate = h("cat1.gif") == h("cat2.gif")
```

So when `cat1.gif` has exactly the same contents as `cat2.gif`, we know they're duplicates of each other.

But what if the two GIFs are mostly the same but slightly different? Like if the same dancing baby GIF shows up twice, but one is slightly larger than the other?

Well, now we're talking about perceptual similarity instead of exact matching. To compare the GIFs in a way that takes this into account, I used Python's [imagehash](https://pypi.org/project/ImageHash/) library to calculate a [perceptual hash](https://www.hackerfactor.com/blog/index.php?/archives/432-Looks-Like-It.html).

Per the [Hacker Factor blog](https://www.hackerfactor.com/blog/index.php?/archives/432-Looks-Like-It.html), this algorithm boils down to:

> 1. **Reduce image size**. The fastest way to remove high frequencies and detail is to shrink the image. In this case, shrink it to 8x8 so that there are 64 total pixels. Don't bother keeping the aspect ratio, just crush it down to fit an 8x8 square. This way, the hash will match any variation of the image, regardless of scale or aspect ratio.
> 2. **Reduce color**. The tiny 8x8 picture is converted to a grayscale. This changes the hash from 64 pixels (64 red, 64 green, and 64 blue) to 64 total colors.
> 3. **Average the colors**. Compute the mean value of the 64 colors.
> 4. **Compute the bits**. This is the fun part. Each bit is simply set based on whether the color value is above or below the mean.
> 5. **Construct the hash**. Set the 64 bits into a 64-bit integer. The order does not matter, just as long as you are consistent. (I set the bits from left to right, top to bottom using big-endian.)
> [Source](https://www.hackerfactor.com/blog/index.php?/archives/432-Looks-Like-It.html).

This process is what imagehash uses under the hood, and it yields great results for detecting image similarity. But a GIF is not just one image - it's made up of many frames! Comparing the one alone could easily miss duplicates where the first frames differ but the rest are the same. To cover this, I sampled multiple frames evenly across the animation and hashed each one individually.

This way, two files will be flagged as duplicates if they share even one visually similar frame. It’s not perfect, two near-duplicates might miss each other if their sampled frames don't overlap, but this catches the majority of cases while staying fast.

Here's an example of calculating these hashes in Python:

```python
from PIL import Image
import imagehash

def sample_frames_evenly(gif_path, num_samples=5):
    frames = []
	with Image.open(gif_path) as img:
		try:
			frame_count = img.n_frames
		except:
			frame_count = 1

		if frame_count == 1: # stills...
			frames.append(img.copy())
			return frames

		if frame_count <= num_samples:
			frame_indices = list(range(frame_count))
		else:
			step = frame_count / num_samples
			frame_indices = [int(i * step) for i in range(num_samples)]

		for frame_idx in frame_indices:
			img.seek(frame_idx)
			frames.append(img.copy())

		return frames if frames else None

def get_gif_frame_hashes(filepath, sample_frames=5):
    frames = sample_frames_evenly(filepath, sample_frames)
    if not frames:
        return None

    hashes = []
    for frame in frames:
        hashes.append(str(imagehash.average_hash(frame)))

    return hashes
```

The next step in processing these is to store which hashes we've already seen as we're looping through each GIF, and then remove any GIF containing a hash we've seen before. And hey presto - no more duplicates!

But what's worse than showing the same GIF twice onstage? Let's look at that next...

### Removing NSFW

{{< tiled-bg src="police.gif" >}}

Let's recap - when you bulk download tens of thousands of images from the internet, you don't just get dancing hamsters - you also get things you *really* don't want projected six feet tall at a public gig.

As tempting as it was to [manually sift through each image](https://youtu.be/dvn-hpZdElo?si=vRLJxkjcmupUBxrb&t=26) and play censor, I decided to outsource the dirty work to my computer.

I used the [vit-base-nsfw-detector](https://huggingface.co/AdamCodd/vit-base-nsfw-detector) image classifier for this. Feed it a frame from a GIF and it'll run it through a transformer that returns a `SFW` or `NSFW` label along with a confidence score between `0` and `1`, with `1` being the "I'm *very* sure this is smut" end of the scale. For this dataset, anything above a `0.4` tended towards no-no territory.

This particular model is a fine tuning of Google's [vit-base-patch16-384](https://huggingface.co/google/vit-base-patch16-384) (trained on [ImageNet21K](https://arxiv.org/pdf/2104.10972v4)'s 14 million images). I tried a few, and this one was a standout in its prudishness.

But here's where my naivete got the best of me again and I learned something new: a few GIFs start out wholesome but then get very naughty very quick. Dancing one moment which turns into undressing the next. The first frame passes the censor, but by frame 20 I'm in breach of the public decency act.

Luckily I already had the tool for the job from the previous deduplication step; sampling multiple frames evenly throughout the GIF and running them _all_ through the classifier. That way we check for decency at multiple points in the GIF. Undressers... consider yourselves thwarted!

Moving right along, here's the code. It's amazing how easy [PyTorch](https://pytorch.org/) and [Hugging Face](https://huggingface.co/) makes it to run models like this locally:

```python
from transformers import pipeline
import torch

# this example assumes you've got a GPU capable of running the model.
# you should also be able to run it on CPU instead, but invoking it
# would look a bit different.
#
# as an aside, my graphics card made a coil whine at a pitch I'd
# never heard it make before while taking on this workload.
# was it... enjoying itself?

CLASSIFIER = pipeline(
  "image-classification", # labels (SFW, NSFW)
  model="AdamCodd/vit-base-nsfw-detector",
  device=0
)

def is_nsfw(gif_path, num_frames=5):
  # from the previous example
  frames = sample_frames_evenly(gif_path, num_frames)
  if not frames:
      return False

  # gotta make sure frames are RGB for our classifier
  rgb_frames = []
  for frame in frames:
    if frame.mode != 'RGB':
      frame = frame.convert('RGB')
      rgb_frames.append(frame)

  frames = rgb_frames

  max_nsfw_score = 0
  for frame in frames:
    results = CLASSIFIER(frame)
    for result in results:
      if result['label'] == "NSFW":
        max_nsfw_score = max(max_nsfw_score, result['score'])

    return max_nsfw_score >= 0.4
```

Something that this doesn't catch is NSFW text *inside* GIFs. For example, there are a few banners in the dataset with BIG letters making declarations like "I LOVE \*\*\*\*".

I could've implemented an OCR step in the pipeline to pick up on bad words. But honestly, life's too short to put every naughty GIF in its place. Some are just destined to slip through the cracks.

*(btw, if you're feeling curious and you're not sitting in an open plan office; you can undo all my hard work and disable filtering by setting the `?safe=no` query param: [gifs.alex.works?safe=no](https://gifs.alex.works?safe=no). Don't say I didn't warn you!)*

With that, the worst of the smut was cleaned out, leaving just one last sanitisation step...

### Removing cat photos

{{< tiled-bg src="cats.gif" >}}

Removing cat photos? Just kidding, I didn't do this. What kind of monster would remove cat photos from their mosaic of GIFs?

But an interesting finding is that this did actually happen, albeit unintentionally. The image classifier I mentioned in the previous step yielded a lot of false positives when it looked at GIFs of cats.

I'll leave speculating as to why that is as an exercise for the reader!

## Animating

{{< tiled-bg src="animation.gif" >}}

With the GIFs downloaded and mostly sanitised, the next step was to display them. My goal was to have this rendering in-browser, and I thought this'd be a good opportunity to play around with [p5.js](https://p5js.org/), which provides a lovely set of APIs for 2D and 3D on top of HTML Canvas/WebGL. If you've used [Processing](https://processing.org/) before you'll find it feels very similar (it's made by the same people).

It's also got a [great online editor](https://editor.p5js.org/) for quickly testing ideas. I'll use it later in the post to share some examples.

You can view the full code for my sketch at [https://gifs.alex.works/assets/sketch.js](https://gifs.alex.works/assets/sketch.js), warts and all - my goal here was to get it working for the show - performance optimisation and ease of extension took a backseat.

Let's talk through some of the more interesting parts though...

### Building the grid

The main idea of the animation is to create a grid of GIFs that slowly pans across the screen. Rows are created to fill the screen vertically, and cells containing GIFs are created within those rows til the screen is filled horizontally too.

Once a screenful of GIFs has loaded, the GIFs should keep streaming in infinitely. To achieve this effect without eventually consuming all RAM in the universe, I remove GIFs that have gone off the left-hand side of the screen, while lazy loading the ones just about to appear on the right.

In an early implementation the row height was the same for all rows and everything panned at the same speed. This looked dull. A nice way to add some visual flair was to randomise the size of each row as well as its panning speed.

Here's a simplified version of my code that uses a single hard-coded GIF so we can focus on layout, panning, and recycling:

```js
const GIF_URL = 'goku.gif'
const BASE_ROW_HEIGHT = 60
const PADDING = 8
const PAN_PER_FRAME = 0.5

let rows = []
let panX = 0
let sourceImg

function preload() {
  sourceImg = loadImage(GIF_URL)
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  buildRows()
  fillInitialCells()
}

function buildRows() {
  rows = []
  let y = 0
  while (y < height) {
    // add some visual interest by randomising height of the
    // row, as well as its panning speed multiplier
    const h = BASE_ROW_HEIGHT + random(0, 50)
    rows.push({
      y,
      height: h,
      speedMul: random(1, 2.5),
      offsetX: 0,
      cells: []
    })
    y += h + PADDING
  }
}

function addCell(row) {
  const aspect = sourceImg.width / sourceImg.height
  const w = Math.floor(row.height * aspect)
  row.cells.push({
    width: w,
    img: sourceImg
  })
}

function fillInitialCells() {
  // fill a little beyond screen width for smoother start
  rows.forEach(row => {
    while (rowWidth(row) < width * 1.2) addCell(row)
  })
}

function rowWidth(row) {
  return row.cells.reduce((sum, c, i) => sum + c.width + (i > 0 ? PADDING : 0), 0)
}

function draw() {
  background(0)
  if (!sourceImg) return

  panX += PAN_PER_FRAME

  rows.forEach(row => {
    const rowPan = panX * row.speedMul

    // need another cell appearing on the right?
    if (row.offsetX + rowWidth(row) < width + rowPan) {
      addCell(row)
      removeOffscreen(row, rowPan)
    }

    push()
    translate(-rowPan, row.y)
    let x = row.offsetX
    row.cells.forEach(cell => {
      image(cell.img, x, 0, cell.width, row.height)
      x += cell.width + PADDING
    })
    pop()
  })
}

function removeOffscreen(row, rowPan) {
  // recycle cells fully scrolled past the left edge
  while (row.cells.length) {
    const first = row.cells[0]
    const firstRight = row.offsetX + first.width
    if (firstRight < rowPan) {
      row.offsetX += first.width + PADDING
      row.cells.shift()
    } else {
      break
    }
  }
}
```

<iframe src="/posts/2025/gifs/demo-building-grid.html" title="Building the Grid Demo" class="ap-post-img w-full h-[400px]" loading="lazy"></iframe>

[Run this on p5.js's online editor](https://editor.p5js.org/alexpls/sketches/DOe9LnunU).

That code is pretty close to what's on [gifs.alex.works](https://gifs.alex.works) at the moment, save a few extra things that the live site does:

- It fades in cells once they've loaded instead of abruptly displaying them,
- Its GIFs aren't hardcoded (duh!). Instead it fetches a list of random ones from the server and downloads them with some concurrency limits - you can explore the [sketch.js](https://gifs.alex.works/assets/sketch.js) file to see how this works.

### CRT shader

To seal the retro vibe deal I added a CRT shader to the canvas (thanks to [Babylon.js](https://babylonjs.medium.com/retro-crt-shader-a-post-processing-effect-study-1cb3f783afbc) for the shader code).

p5.js makes it very easy to load in a shader defined in GLSL and apply it as a filter to an existing canvas, which is exactly what I did:

```javascript
const GIF_URL = 'goku.gif'
let gifImg
let buffer, crt

function preload() {
  gifImg = loadImage(GIF_URL)
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  initBuffer()
}

function initBuffer() {
  // create a buffer at a max width of 1920 for our draws. we don't
  // want to exceed this width because otherwise too many GIFs will
  // be loaded at once and we'll tank performance.
  const bw = min(windowWidth, 1920)
  const scale = windowWidth / bw
  const bh = Math.floor(windowHeight / scale)
  buffer = createGraphics(bw, bh, WEBGL)
  buffer.pixelDensity(1)

  // instantiate the shader
  crt = buffer.createFilterShader(CRT_SHADER_SRC)
}

function draw() {
  buffer.background(0)

  // tile the gif to fill the buffer for a prettier example
  if (gifImg) {
    const tileW = gifImg.width
    const tileH = gifImg.height
    buffer.push()
    buffer.imageMode(CORNER)
    // note: WEBGL origin is center, so iterate from -width/2,-height/2
    const startX = -buffer.width / 2
    const startY = -buffer.height / 2
    for (let ty = startY; ty < buffer.height / 2; ty += tileH) {
      for (let tx = startX; tx < buffer.width / 2; tx += tileW) {
        buffer.image(gifImg, tx, ty, tileW, tileH)
      }
    }
    buffer.pop()
  }

  // apply the shader
  if (crt) buffer.filter(crt)

  background('black')

  // draw the image back to the main buffer (the onscreen canvas)
  // and scale it so it fits
  image(buffer, 0, 0, width, height)
}


// https://babylonjs.medium.com/retro-crt-shader-a-post-processing-effect-study-1cb3f783afbc
const CRT_SHADER_SRC = `
precision highp float;

uniform sampler2D tex0;
varying vec2 vTexCoord;

vec2 curveRemapUV(vec2 uv) {
  // as we near the edge of our screen apply greater distortion using a cubic function
  uv = 2.0 * uv - 1.0;
  vec2 curvature = vec2(6.0);
  vec2 offset = abs(uv.yx) / curvature;
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  return uv;
}

vec4 adjBrightness(vec2 inUV, vec4 clr) {
  float r = 0.5;
  vec2 cornerUV = min(2.0 * (0.5 - abs(inUV - vec2(0.5))) + r, 1.0);
  float br = cornerUV.x * cornerUV.y + 0.15;
  br = pow(cornerUV.x * cornerUV.y, 2.2) + 0.45;
  br = clamp(br * br * br * br + 0.55, 0.0, 1.0);
  return clr * br;
}

void main() {
  vec2 remappedUV = curveRemapUV(vTexCoord);
  vec4 baseColor = texture2D(tex0, remappedUV);
  if (remappedUV.x < 0.0 || remappedUV.y < 0.0 || remappedUV.x > 1.0 || remappedUV.y > 1.0){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    gl_FragColor = adjBrightness(vTexCoord, baseColor);
  }

  gl_FragColor *= abs(sin(remappedUV.y * 1024.0));
  gl_FragColor.a = 1.0;
}
`
```

<iframe src="/posts/2025/gifs/demo-crt-shader.html" title="CRT Shader Demo" class="ap-post-img w-full h-[400px]" loading="lazy"></iframe>

[Run this on p5.js's online editor](https://editor.p5js.org/alexpls/sketches/IXsZy7fXi)

Switching from 2D rendering to WebGL changes the coordinate origin to the center of the canvas, as opposed to the top left. So some maths has to be updated accordingly.

You can set the `?shader=no` query param on the site if you want to see what it looks like without the shader: [gifs.alex.works?shader=no](https://gifs.alex.works?shader=no)

### Starfield

The grid on its own looked good, but there was still something missing. The background was just plain black. That is prime real estate for more nostalgic throwbacks, so I capitalized on the opportunity and added a star field effect.

The stars are randomly distributed on the canvas, and pan left over time. When one goes off the left of the screen, it reappears again on the right at a random point on the y axis.

Initially I drew a little circle for each star, but I worried that with a large enough screen and a slow enough computer, drawing up to 2,000 circles per frame would bog down performance. So I switched to adding each star as a vertex on one big `POINTS` shape instead, and just drawing that shape. This resulted in just one draw call per frame:

```javascript
let stars = []

function setup() {
  createCanvas(windowWidth, windowHeight)
  initStars()
}

function draw() {
  background('black')
  drawStars()
}

function initStars() {
  const maxStars = 2000
  const density = 1000 // bigger = fewer stars
  const target = Math.min((width * height) / density, maxStars)
  for (let i = 0; i < target; i++) {
    stars.push({
      x: random(0, width),
      y: random(0, height),
      speed: random(0.1, 0.5),
      size: random(0.5, 3)
    })
  }
}

function drawStars() {
  stroke(255, 255, 255, 150)
  strokeWeight(2)
  beginShape(POINTS)
  stars.forEach(s => {
    s.x -= s.speed
    if (s.x < 0) {
      s.x = width
      s.y = random(0, height)
    }
    vertex(s.x, s.y)
  })
  endShape()
}
```

<iframe src="/posts/2025/gifs/demo-starfield.html" title="Starfield Demo" class="ap-post-img w-full h-[400px]" loading="lazy"></iframe>

[Run this on p5.js's online editor](https://editor.p5js.org/alexpls/sketches/DNxa8sB2-)

With a backdrop for the GIFs, the animation was done. But there was still something ruining my fun...

### GIFs crashing the sketch

p5.js could not decode all the GIFs I'd sourced, and regrettably its behaviour when coming across a dodgy one was to outright crash the sketch in an unrecoverable way. I raised [an issue](https://github.com/processing/p5.js/issues/8021) on p5.js's GitHub about this, but in the interest of getting things working in time for the show I hacked together a quick fix in a fork that I'm now using on the live site.

It helped with not outright crashing the sketch when a GIF failed to load, but still the overall miss rate on the GIFs was quite high - and downloading them just to throw them in the bin was causing a lot of unnecessary bandwidth and processing churn.

I attempted ways to detect invalid GIFs serverside but couldn't exactly narrow down what would make p5.js crash. Some of its failures seemed quite arbitrary, so I changed tack and wrote a sketch to iterate through all the GIFs and try to load them. If one didn't work it'd catch the error and send a signal back to the server indicating that the particular file is bad and should be quarantined.

This hacky approach worked well, and I haven't seen a GIF load error since:

```javascript
let data, i = 0, ok = 0, bad = 0

function preload() {
  data = loadJSON('load from gifs api')
}

function setup() {
  createCanvas(600, 200)
  next()
}

function next() {
  if (!data || i >= data.urls.length) return
  const url = data.urls[i++]

  loadImage(url,
    img => { ok++; schedule() },
    _err => {
      bad++

      // here's where i made a request to backend
	  // to mark gif as invalid

      schedule()
    }
  )
}

function schedule() { setTimeout(next, 10) }

function draw() {
  if (!data) return
  background(0)
  fill(255)
  textAlign(CENTER, CENTER)
  const total = data.urls.length
  text(`Checked ${i}/${total}`, width/2, height/2 - 20)
  text(`valid ${ok}  invalid ${bad}`, width/2, height/2 + 10)
}
```

## Hosting

{{< tiled-bg src="server.gif" >}}

Hosting this thing is intentionally unremarkable. It's being served out of a one-file Go app on my server, sitting behind the glorious Cloudflare proxy (seriously, how is that thing free?)

When the app starts up it reads the GIF paths from the filesystem, and serves a random assortment of URLs to the frontend. It also serves up the actual image files when they're requested, with generous cache TTLs so Cloudflare absorbs as much of that traffic as possible.

## Optimisation ideas

There's definitely room for optimisation here. A screenful of GIFs can number in the hudreads, so a fair bit of network bandwidth gets used when viewing the site. This inefficiency is the first thing I'd tackle if looking at making improvements.

There are two parts to this problem which I've considered:

- **GIF size**: GIFs are an especially large format considering how much visual data they actually convey. Switching to something more efficient and modern like WebM would greatly help reduce the size of the files being transferred.
- **Number of requests**: assembling a few GIFs into a longer strip and sending that as one file would help reduce the number of web requests being made.

Also functionally, I think it'd be neat to add some more interactivity to the site, like being able to scroll on rows so you can backtrack to a GIF you wanted to look at for longer. Or being able to click on a GIF to go to the GeoCities site in the Archive that it originated from.

However, neither of these things would've helped with projecting the grid at a gig, so I left 'em on the table.

## Conclusion

{{< tiled-bg src="theend.gif" >}}

And there you have it. It was a blast working on this and bringing a bit of GeoCities chaos back to life for a few minutes. Now I've just gotta figure out how to up the ante next year :)

Huge thanks again to the Internet Archive for preserving GeoCities - this project would have been much harder without them. Please [donate to the Archive](https://archive.org/donate?origin=iawww-TopNavDonateButton) if you can!

Oh, and did I mention we won?

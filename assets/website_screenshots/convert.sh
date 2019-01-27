#!/bin/bash

set -e

desired_width="1200"
desired_height="500"

for filename in *-original.jpg *-original.png; do
  cropped_filename="${filename/original.*/cropped@2x.jpg}"
  cropped_filename_lowres="${filename/original.*/cropped.jpg}"

  convert $filename \
    -sampling-factor 4:2:0 \
    -strip \
    -quality 85 \
    -interlace JPEG \
    -resize "${desired_width}x${desired_height}^" \
    -gravity North \
    -crop "${desired_width}x${desired_height}+0+0" \
    +repage \
    $cropped_filename

    convert $cropped_filename \
      -resize "50%" \
      $cropped_filename_lowres
done
#!/bin/bash

set -e

desired_width="2160"

for filename in *.jpg; do
  resized_filename="${filename/-original.jpg/.jpg}"

  convert $filename \
    -sampling-factor 4:2:0 \
    -strip \
    -quality 85 \
    -interlace JPEG \
    -resize "${desired_width}x" \
    $resized_filename
done

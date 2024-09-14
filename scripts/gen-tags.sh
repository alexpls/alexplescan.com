#!/bin/bash

set -ex

bash scripts/list-tags.sh |
  xargs -I '{}' hugo new content 'content/tags/{}/_index.md'

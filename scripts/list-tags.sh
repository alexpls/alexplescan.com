#!/bin/bash

rg 'tags = ' . --glob 'content/posts/**/index.md' |
  sed "s/.*tags = \['\(.*\)'\]/\1/" |
  tr "', '" "\n" |
  grep -v '^$' |
  sort |
  uniq

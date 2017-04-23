#!/usr/bin/env bash

if [ ! -d ./sd2 ]; then
  echo "Downloading sd2 lib"
  curl https://codeload.github.com/majexa/sd2/tar.gz/master | tar zx
  mv sd2-master sd2
fi

#!/bin/sh

docker run -it --rm -v "$(pwd):/project" staticpages/cli ./bin/watch.sh

@echo off

docker run -it --rm -v "%cd%:/project" staticpages/cli ./bin/watch.sh

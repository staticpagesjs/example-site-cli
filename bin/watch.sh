#!/bin/sh

chokidar "**/*.md" "**/*.yaml" "**/*.js" "**/*.twig" -c "./bin/build.sh"

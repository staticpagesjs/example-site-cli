#!/bin/sh

chokidar "public/**" "**/*.md" "**/*.yaml" "**/*.js" "**/*.twig" -c "./bin/build.sh"

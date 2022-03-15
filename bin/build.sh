#!/bin/sh

DIR="$( cd "$( dirname "$0" )" && pwd )"

$DIR/clean.sh
$DIR/generate.sh
$DIR/copy-public.sh

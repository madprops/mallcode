#!/usr/bin/env bash
files=$(git ls-files -- "*.js")
files=$(echo $files | tr " " "\n" | grep -v "/libs/" | grep -v "action_funcs_posts.js" | grep -v "libs.bundle.js" | grep -v "main.bundle.js" | tr "\n" " ")

if [ -n "$files" ]; then
  npm run --silent fix $files
fi
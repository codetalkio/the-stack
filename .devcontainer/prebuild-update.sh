#!/usr/bin/env bash

echo "Updating development environment..."
echo "Current directory: $(pwd)"
echo "Home: $HOME"
echo "Who am i: $(whoami)"

# shellcheck disable=SC2155
export PROJECT_NAME=$(pwd | cut -d'/' -f3)
export CI=true

echo "Rerunning tooling install..."
just install-tooling

echo "Upgrading bun..."
bun upgrade

echo "Setting up all projects..."
just setup-all

echo "Building all projects in release mode..."
just build-all release

echo "Building all projects in local mode..."
just build-all local

echo '🥳 All prebuild update steps are done, hurray!'

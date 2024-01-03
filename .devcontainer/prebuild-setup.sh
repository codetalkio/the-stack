#!/usr/bin/env bash

echo "Setting up development environment..."
echo "Current directory: $(pwd)"
echo "Home: $HOME"
echo "Who am i: $(whoami)"

# shellcheck disable=SC2155
export PROJECT_NAME=$(pwd | cut -d'/' -f3)
export CI=true

# Reset our shell-config.
echo "" >"/workspaces/.config/shell-config"

# Setup path of XDG_CONFIG_HOME to the workspace folder, so is persisted.
mkdir -p /workspaces/.config
echo "export XDG_CONFIG_HOME=/workspaces/.config" >>"/workspaces/.config/shell-config"
# Configure and setup initialization of nodenv. We want this after nvm to make sure
# it gets preference on path.
echo 'export NODENV_ROOT="/workspaces/.config/nodenv"' >>"/workspaces/.config/shell-config"
echo 'export PATH="$NODENV_ROOT/bin:$PATH"' >>"/workspaces/.config/shell-config"
echo 'eval "$(nodenv init -)"' >>"/workspaces/.config/shell-config"
# Configure and setup initialization of pyenv.
echo 'export PYENV_ROOT="/workspaces/.config/pyenv"' >>"/workspaces/.config/shell-config"
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >>"/workspaces/.config/shell-config"
echo 'eval "$(pyenv init -)"' >>"/workspaces/.config/shell-config"
# Set a proper UTF-8 locale.
echo "# Generated on date: $(date)" >>"/workspaces/.config/shell-config"
echo "export LC_ALL=en_US.UTF-8" >>"/workspaces/.config/shell-config"
echo "export LANG=en_US.UTF-8" >>"/workspaces/.config/shell-config"
# Enable the Docker Buildkit functionality.
echo "export COMPOSE_DOCKER_CLI_BUILD=1" >>"/workspaces/.config/shell-config"
echo "export DOCKER_BUILDKIT=1" >>"/workspaces/.config/shell-config"
echo 'eval $(ssh-agent)' >>"/workspaces/.config/shell-config"
# Set the yarn cache folder to the workspace folder, so is persisted.
echo "export YARN_CACHE_FOLDER=/workspaces/.cache/yarn" >>"/workspaces/.config/shell-config"
yarn config set cache-folder /workspaces/.cache/yarn
# Set up the bun cache.
cp /workspaces/$PROJECT_NAME/.devcontainer/bunfig.toml /workspaces/.config/.bunfig.toml
echo "export BUN_INSTALL=/workspaces/.config/bun" >>"/workspaces/.config/shell-config"
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >>"/workspaces/.config/shell-config"
# Configure rustup and cargo paths.
echo "export RUSTUP_HOME=/workspaces/.config/rustup" >>"/workspaces/.config/shell-config"
echo "export CARGO_HOME=/workspaces/.config/cargo" >>"/workspaces/.config/shell-config"
echo 'export PATH="$CARGO_HOME/bin:$PATH"' >>"/workspaces/.config/shell-config"
# Setup path for rover's changed location.
echo 'export PATH="/workspaces/.rover/bin:$PATH"' >>"/workspaces/.config/shell-config"
# Configure cache path for Playwright.
echo "export PLAYWRIGHT_BROWSERS_PATH=/workspaces/.config/playwright" >>"/workspaces/.config/shell-config"


# Configure AWS.
echo "export AWS_DEFAULT_REGION=eu-central-1" >>"/workspaces/.config/shell-config"
echo "export AWS_REGION=eu-central-1" >>"/workspaces/.config/shell-config"

# Create some neat aliases for git.
echo 'alias gst="git status"' >>"/workspaces/.config/shell-config"
echo 'alias gco="git checkout"' >>"/workspaces/.config/shell-config"
echo 'alias gl="git pull"' >>"/workspaces/.config/shell-config"
echo 'alias gp="git push"' >>"/workspaces/.config/shell-config"

# Let the user know about the tips command.
echo "source /workspaces/$PROJECT_NAME/.devcontainer/tips.sh" >>"/workspaces/.config/shell-config"
echo "echo \"Run 'tips' to see list of commands and tricks.\"" >>"/workspaces/.config/shell-config"

# Source our paths and add it to various configuration files.
echo 'source /workspaces/.config/shell-config' >>"$HOME/.bashrc"
echo 'source /workspaces/.config/shell-config' >>"$HOME/.zshrc"

source /workspaces/.config/shell-config

# Install mysql-client to get access to mysqladmin, as well as entr for watching files.
echo ">> Installing mysql and entr..."
sudo apt-get install -y mysql-client entr

# Install pyenv.
echo ">> Installing pyenv..."
[ ! -d "$PYENV_ROOT" ] && curl https://pyenv.run | bash
eval "$(pyenv init -)"

# Install nodenv.
echo ">> Installing nodenv..."
[ ! -d "$NODENV_ROOT" ] && git clone https://github.com/nodenv/nodenv.git "$NODENV_ROOT"
(cd $NODENV_ROOT && src/configure && make -C src)
mkdir -p "$(nodenv root)"/plugins
[ ! -d "$(nodenv root)/plugins/node-build" ] && git clone https://github.com/nodenv/node-build.git "$(nodenv root)/plugins/node-build"
[[ -f "/workspaces/$PROJECT_NAME/ui-app/.node-version" ]] && nodenv install --skip-existing "$(cat /workspaces/$PROJECT_NAME/ui-app/.node-version)"
[[ -f "/workspaces/$PROJECT_NAME/deployment/.node-version" ]] && nodenv install --skip-existing "$(cat /workspaces/$PROJECT_NAME/deployment/.node-version)"

just install-tooling

# Move rover into the /workspaces folder.
mv $HOME/.rover /workspaces/.rover

echo '🥳 All prebuild setups steps are done, hurray! Continuing with the update steps...'

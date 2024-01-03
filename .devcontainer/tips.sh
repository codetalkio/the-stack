#!/usr/bin/env bash

function tips() {
  # Output common commands to get started.
  echo "$(tput bold)Running services$(tput sgr0)"
  echo "  $(tput bold)Running UI apps$(tput sgr0)"
  echo '    └── just dev ui-app'
  echo '    └── just dev ui-internal'
  echo "  $(tput bold)Running the API$(tput sgr0)"
  echo '    └── just dev ms-cosmo'
  echo '    └── just dev ms-gql-users'
  echo '    └── just dev ms-gql-products'
  echo '    └── just dev ms-gql-reviews'
  echo ""

  echo "$(tput bold)GitHub CLI (all run locally)$(tput sgr0)"
  echo "  $(tput bold)Connect to the Codespace via SSH$(tput sgr0)"
  echo "    └── gh codespace ssh --codespace $CODESPACE_NAME"
  # See more about copying here: https://docs.github.com/en/codespaces/developing-in-codespaces/using-github-codespaces-with-github-cli#copy-a-file-tofrom-a-codespace.
  echo "  $(tput bold)Copy files between Codespace and local$(tput sgr0)"
  echo "    └── From local to codespace home dir:"
  echo "          gh codespace cp --codespace $CODESPACE_NAME myfile.txt remote:"
  echo "    └── From local to specific codespace dir:"
  echo "          gh codespace cp --codespace $CODESPACE_NAME myfile.txt remote:/workspaces/the-real-stack/my-dir"
  echo "    └── From codespace to local current dir:"
  echo "          gh codespace cp --codespace $CODESPACE_NAME remote:myfile.txt ."
  # See more about SSH and ports here https://docs.github.com/en/codespaces/developing-in-codespaces/using-github-codespaces-with-github-cli#ssh-into-a-codespace.
  echo "  $(tput bold)Port forward MySQL from Codespace to local$(tput sgr0)"
  echo "    └── gh codespace ports forward 3306:3306 --codespace $CODESPACE_NAME"
  echo "  $(tput bold)Make a port available to all in the Github Organization$(tput sgr0)"
  echo "    └── gh codespace ports visibility 80:org --codespace $CODESPACE_NAME"
  echo "  $(tput bold)List all ports for a Codespace$(tput sgr0)"
  echo "    └── gh codespace ports --codespace $CODESPACE_NAME"
  echo ""

  echo "Run 'tips' to see this again."
}

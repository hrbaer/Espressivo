#!/bin/sh

# Copies the 'dist' folder to the Web server
echo Note that this script publishes the latest app version on the Web server.
# 'sudo' might be required
rsync -aruv --del ./dist/ hbaer@ursa10.local:/Library/WebServer/Documents/apps/espressivo

#!/bin/bash
apt-get update
apt-get install -y chromium-browser
export CHROME_BIN=/usr/bin/chromium-browser
npm install 
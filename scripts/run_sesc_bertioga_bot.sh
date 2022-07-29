#!/bin/bash
BASEDIR=$(dirname "$0")

cd $BASEDIR/../
export NODE_HOME=/opt/node14
export PATH=$PATH:$NODE_HOME/bin
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
npm start

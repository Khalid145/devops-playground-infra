#!/usr/bin/env bash

export MYSQL_PASSWORD=$(cat /dev/urandom | base64 | head -c 16)

exec "$@"
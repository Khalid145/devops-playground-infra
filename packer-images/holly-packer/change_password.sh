#!/usr/bin/env bash

set -e

# Curl an JQ are needed for changing the password
hash curl
hash jq

curlRetries="7" # Waits for up to 2 minutes

adminUsername="guacadmin"
oldPassword='guacadmin'
newPassword='7$SX0jFYSouvRa9'

echo "Retrieving the guacamole admin token"

output=$(curl -sS -f --retry ${curlRetries}  -X POST localhost/api/tokens --data "username=${adminUsername}&password=${oldPassword}")
token=$(jq --raw-output '.authToken' <<< "$output")

echo "Changing the admin password"

curl -sS --retry ${curlRetries} -X PUT "localhost/api/session/data/mysql/users/guacadmin/password?token=$token" -H 'Content-Type: application/json' --data "{\"oldPassword\":\"${oldPassword}\",\"newPassword\":\"${newPassword}\"}"

echo "Admin credentials: Username: ${adminUsername}, Password: ${newPassword}"

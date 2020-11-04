#!/bin/bash

echo "8OQxZPbC43M=" | base64 -d > /home/playground/.vnc/passwd

sudo mv /tmp/files/xstartup /home/playground/.vnc/xstartup

sudo chmod +x /home/playground/.vnc/xstartup
sudo chmod 700 /home/playground/.vnc/passwd
sudo chown playground: -R /home/playground/.vnc


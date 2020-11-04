#!/bin/bash

echo "--> Create wetty service account"
sudo useradd wetty \
   --shell /bin/bash \
   --create-home
   
echo "wetty:$(pwgen -1 16)" | sudo chpasswd
sudo tee /etc/sudoers.d/wetty > /dev/null <<"EOF"
wetty ALL=(ALL:ALL) ALL
EOF
sudo chmod 0440 /etc/sudoers.d/wetty
sudo usermod -a -G sudo wetty


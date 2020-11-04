#!/bin/bash

echo "--> Setting hostname..."
echo "playground-workstation" | sudo tee /etc/hostname
sudo hostname -F /etc/hostname

echo "--> Adding hostname to /etc/hosts"
sudo tee -a /etc/hosts > /dev/null <<EOF

# For local resolution
$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)  playground-workstation
EOF

sudo useradd -G sudo playground --shell /bin/bash --create-home
echo 'playground:PandaPlay.19' | sudo chpasswd
sudo sed -ie 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
echo "playground ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers
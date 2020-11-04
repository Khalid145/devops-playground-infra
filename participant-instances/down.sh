#!/usr/bin/env bash

set -e

# Helper functions

function show_title {
    green='\033[1;32m'
    clear='\033[0m'
    printf "\n${green}%s${clear}\n\n" "${1}"
}

function terraform_destroy {
    plan_file="out.plan"

    terraform init
    terraform plan -out="${plan_file}" -destroy
    read -p "Do you wish to destroy [y/N]?" -r
    if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
        exit 1
    fi
    terraform apply "${plan_file}"
    rm -f "${plan_file}"
}

show_title "Destroying VMs"
(
    cd nachos/

    terraform_destroy
)

show_title "Destroying Guacamole"
(
    cd guacamole/

    terraform_destroy
)

show_title "Destroying VPC"
(
    cd vpc/

    terraform_destroy
)

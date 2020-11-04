#!/usr/bin/env bash

set -e

# Curl is needed for Guacamole healthcheck
hash curl

# Helper functions

function show_title {
    green='\033[1;32m'
    clear='\033[0m'
    printf "\n${green}%s${clear}\n\n" "${1}"
}

function terraform_apply {
    plan_file="out.plan"

    terraform init
    terraform plan -out="${plan_file}"
    read -p "Do you wish to apply [y/N]?" -r
    if [[ ! "${REPLY}" =~ ^[Yy]$ ]]; then
        exit 1
    fi
    terraform apply "${plan_file}"
    rm -f "${plan_file}"
}

function wait_for {
    retries=20
    retry_delay=5

    until curl -sSf -o /dev/null "${1}"; do
        if [[ "${retries}" -le "0" ]];then
        echo "Maximum retries reached"
        exit 1
        fi

        retries=$((retries-1))
        echo "Sleeping ${retry_delay} seconds. ${retries} retries left."
        sleep ${retry_delay}
    done
}

# # Provision VPC
show_title "Provisioning VPC"
(
    cd vpc/

    show_title "Provisioning VPC"
    terraform_apply
)


# Provision Guacamole
show_title "Provisioning Guacamole"
(
    cd guacamole/

    show_title "Guacamole: Provisioning Terraform"
    terraform_apply

    show_title "Guacamole: Waiting for Instance to become available"
    guacamole_ip=$(terraform output instance_ip)
    wait_for "http://$guacamole_ip/"
)

# Provision Nachos
show_title "Provisioning VMs"
(
    cd nachos/

    show_title "VMs: Provisioning Terraform"
    terraform_apply
)


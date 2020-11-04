#!/bin/bash

# Start VNC Server
function start_vnc_server {
    sudo systemctl enable vncserver@1.service
    sudo systemctl start vncserver@1.service
}

function clone_git_repo {
    cd home/playground
    mkdir Desktop
    cd Desktop
    echo "${git_url}" > git_url.txt
    git_repo_url=`cat git_url.txt`
    rm -rf git_url.txt
    if [ "$git_repo_url" != "not-provided"  ]
        then
            echo "${git_username}" > git_username.txt
            echo "${git_password}" > git_password.txt
            git_user=`cat git_username.txt`
            git_pass=`cat git_password.txt`
            rm -rf git_username.txt
            rm -rf git_password.txt
            git clone https://"$(echo $git_user)":"$(echo $git_pass)"@$(echo $git_repo_url)
    fi
}

# Retrieve Dependencies and Execute Ansible
function execute_ansible {

    cd ~/../../tmp/ansible-scripts/
    # Retrieve list of softwares to install from environmental variable and add to variable.
    echo "${softwares_dependency}" > software_dependencies.txt
    software_dependencies=`cat software_dependencies.txt`
    echo "$software_dependencies" >> script.log

    if [ "$software_dependencies" == "[]"  ]
        then
            IsAnsibleListExist=`echo false`
            echo "$IsAnsibleListExist" >> script.log
    else
        export ANSIBLE_DEBUG=True
        software_array=$(echo $software_dependencies | tr "[,]" "\n")
        
        # Create Master Playbook with the list of softwares to install.
        echo "---" >  master-playbook.yml
        for x in $software_array
            do
                echo "- import_playbook: $x" >> master-playbook.yml
            done
        # Execute Ansible and save output to text file.
        ansible-playbook master-playbook.yml -vvv > ansible-output.log
    fi
}

function send_ansible_status {

    cd tmp/ansible-scripts/

    if [ "$IsAnsibleListExist" == "false"  ]
        then
            echo "Skipped" >> ansible-action.log
            ansible_status_message="Skipped"        
    else
        ansible_status=$(grep "ok=" ansible-output.log)

        ok_status=$(echo $ansible_status | cut -d' ' -f3)
        changed_status=$(echo $ansible_status | cut -d' ' -f4)
        unreachable_status=$(echo $ansible_status | cut -d' ' -f5)
        failed_status=$(echo $ansible_status | cut -d' ' -f6)
        skipped_status=$(echo $ansible_status | cut -d' ' -f7)
        rescued_status=$(echo $ansible_status | cut -d' ' -f8)
        ignored_status=$(echo $ansible_status | cut -d' ' -f9)
        
        if [ "$failed_code" > "0"  ]
            then
                echo "Not successful - failed" >> ansible-action.log
                ansible_status_message="Failed"
        elif [ "$unreachable_code" > "0" ]
            then
                echo "Not successful - unreachable" >> ansible-action.log
                ansible_status_message="Failed"
        else
            echo "Successful" >> ansible-action.log
            ansible_status_message="Success"
        fi
    fi

    # private_ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')

    # instance_tagname=$(nslookup $private_ip)

    # formatted_instance_tagname=$(echo $instance_tagname | cut -d' ' -f4 | cut -d'.' -f1) 

    # echo $private_ip >> ansible-action.log
    # echo $formatted_instance_tagname >> ansible-action.log

    public_ip=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)

    echo "${api_url}" > api_url.txt
    api_url=`cat api_url.txt`
    echo "$api_url"
    
    curl -i \
    -H "Accept: application/json" \
    -H "Content-Type:application/json" \
    -X POST --data "$(generate_post_data)" "$(echo $api_url)/terraform-state" >> ansible-action.log
}

function generate_post_data() {
    cat <<EOF
    {
        "path": "ansible-status",
        "data": {
            "public_ip": "$public_ip",
            "status": "$ansible_status_message"
        }
    }
EOF
}

start_vnc_server

clone_git_repo

execute_ansible

send_ansible_status

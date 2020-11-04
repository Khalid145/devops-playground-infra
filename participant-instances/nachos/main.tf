provider "aws" {
  version = "~> 2.0"
  region  = "eu-west-1"
}

terraform {
  required_version = ">= 0.11.14, < 0.12.0"
}

# Randomiser for the SSH key name
resource "random_string" "ssh_key_name_ending" {
  length  = 8
  special = false
}

# Some local variables, which i don't want to handle through exported variables.
locals {
  stack        = "demo-stack"
  ssh_key_name = "demo-stack-ssh-key-${random_string.ssh_key_name_ending.result}"
}

# Generating a number of animal names, which then we'll be using as domain names
module "animal" {
  source = "../modules/animal_names/"
  count  = "${var.count}"
}

# Generating a specific SSH key, so the user doesn't have to have a key stored for AWS already.
resource "tls_private_key" "ssh_keypair" {
  count     = 1
  algorithm = "RSA"
}

resource "aws_key_pair" "ssh_key" {
  key_name   = "${local.ssh_key_name}"
  public_key = "${tls_private_key.ssh_keypair.public_key_openssh}"

  provisioner "local-exec" {
    command = "echo \"${tls_private_key.ssh_keypair.private_key_pem}\" > ${local.ssh_key_name}.pem && chmod 400 ${local.ssh_key_name}.pem"
  }

  provisioner "local-exec" {
    when    = "destroy"
    command = "rm -f ${local.ssh_key_name}.pem"
  }
}

resource "aws_security_group" "vnc" {
  name_prefix = "vnc-sg-"
  description = "Security group for accessing VNC-enabled instances from Guacamole"

  vpc_id = "${data.terraform_remote_state.vpc_state.vpc_id}"

  ingress {
    from_port   = 5901
    to_port     = 5901
    protocol    = "tcp"
    cidr_blocks = ["${data.terraform_remote_state.guac_state.instance_ip}/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name = "dpg-Guacamole-Nachos"
  }
}

# This is the module actually creating the linux instance. 
# You need to pass the animal names list, to allow the module to change hostnames for the instances.
module "linux_instances" {
  source                    = "../modules/linux_instance/"
  count                     = "${var.count}"
  stack_name                = "${local.stack}"
  vpc_id                    = "${data.terraform_remote_state.vpc_state.vpc_id}"
  subnet_ids                = ["${data.terraform_remote_state.vpc_state.vpc_subnets}"]
  default_security_group_id = "${aws_security_group.vnc.id}"
  animal_names              = "${module.animal.names}"
  ssh_key_name              = "${local.ssh_key_name}"
  ssh_user                  = "${var.ssh_user}"
  ssh_password              = "${var.ssh_password}"
  custom_install_scripts    = "${data.template_file.install_scripts.*.rendered}"

  instance_type = "${var.instance_type}"
  flavour       = "${var.instance_flavour}"

}

# This block starts the VNC daemon, and installs all the custom scripts that are located
data "template_file" "install_scripts" {
  vars {
    softwares_dependency = "${var.softwares_dependency}",
    git_url = "${var.git_url}",
    api_url = "${var.api_url}",
    git_username = "${var.git_username}",
    git_password = "${var.git_password}"
  }
  template = "${file("scripts/install_env.sh")}"
}

module "dns" {
  source       = "../modules/dns/"
  animal_names = "${module.animal.names}"
  count        = "${var.count}"
  ip_addresses = "${module.linux_instances.ip_addresses}"

  # If the Playground is happening outside London, change the below Hosted Zone ID to match the location
  r53_zone_id = "ZKL6DCZ2ESZ63"
}

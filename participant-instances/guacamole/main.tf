provider "aws" {
  version = "~> 2.0"
  region  = "eu-west-1"
}

terraform {
  required_version = ">= 0.11.14, < 0.12.0"
}

locals {
  instance_type = "${var.instance_type}"
}

resource "aws_security_group" "guacamole" {
  name_prefix = "guacamole-sg-"
  description = "Security group for the Guacamole instance"

  vpc_id = "${data.terraform_remote_state.vpc_state.vpc_id}"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow access to Guacamole over SSH"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow access to Guacamole over HTTP"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags {
    Name = "dpg-Guacamole"
  }
}

resource "aws_instance" "guacamole" {
  ami           = "${data.aws_ami.guacamole.id}"
  instance_type = "${local.instance_type}"

  vpc_security_group_ids = ["${aws_security_group.guacamole.id}"]

  tags {
    Name = "dpg-Guacamole"
    Owner = "${lower(element(split("/",data.aws_caller_identity.current_user.arn),1))}"
    CustodianOffHours = "off"
  }

  subnet_id = "${data.terraform_remote_state.vpc_state.vpc_subnets.0}"
}

resource "aws_route53_record" "guacamole" {
  # If the Playground is happening outside London, change the below Hosted Zone ID to match the location
  zone_id = "ZKL6DCZ2ESZ63"
  name    = "guacamole.ldn.devopsplayground.com"
  type    = "A"
  ttl     = "300"
  records = ["${aws_instance.guacamole.public_ip}"]
}

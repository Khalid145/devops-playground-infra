data "aws_caller_identity" "current_user" {}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["*dpg-base-ubuntu-${var.flavour}-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["415830525771"] # Canonical
}

resource "random_string" "wetty" {
  length  = 16
  special = true
}

data "template_file" "user_data" {
  count    = "${var.count}"
  template = "${file("${path.module}/scripts/user_data_linux.sh")}"

  vars {
    hostname              = "${var.stack_name}-${element(var.animal_names, count.index)}"
    count                 = "${count.index}"
    ssh_user              = "${var.ssh_user}"
    ssh_pass              = "${var.ssh_password}"
    custom_install_script = "${element(var.custom_install_scripts,count.index)}"
    wetty_pw              = "${random_string.wetty.result}"
  }
}

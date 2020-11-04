data "template_file" "user_data" {
  count    = "${var.count > 0 ? var.count : 0}"
  template = "${file("${path.module}/scripts/user_data.ps1")}"

  vars {
    hostname              = "${var.stack_name}-${count.index}"
    var_instance_username = "${var.rdp_user}"
    var_instance_password = "${var.rdp_password}"
    var_animal_name       = "${lower(element(var.animal_names,count.index))}"
    custom_install_script = "${element(split("XAXAXAXAXAXA", var.custom_install_scripts),count.index)}"
  }
}

data "aws_availability_zones" "zones" {}
data "aws_caller_identity" "current_user" {}

data "aws_ami" "windows2016" {
  count = "${var.count > 0 ? var.count : 0}"

  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Windows_Server-2016-English-Full-Base-*"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

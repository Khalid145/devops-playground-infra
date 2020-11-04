data "aws_ami" "guacamole" {
  most_recent = true
  name_regex  = "dpg-guacamole-ubuntu-.*"

  owners = ["415830525771"]
}

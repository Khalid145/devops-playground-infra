resource "aws_security_group" "security_group" {
  count       = "${var.count > 0 ? 1 : 0}"
  name        = "security_group_windows"
  description = "Allow all traffic"
  vpc_id      = "${var.vpc_id}"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "windows_instances" {
  count             = "${var.count}"
  ami               = "${data.aws_ami.windows2016.id}"
  subnet_id         = "${var.subnet_ids[0]}"
  instance_type     = "${var.instance_type}"
  get_password_data = true
  key_name          = "${var.ssh_key_name}"

  vpc_security_group_ids = [
    "${aws_security_group.security_group.id}",
    "${var.default_security_group_id}",
  ]

  associate_public_ip_address = true
  user_data                   = "${element(data.template_file.user_data.*.rendered,count.index)}"

  tags {
    Name  = "${var.stack_name}-w-${lower(element(var.animal_names,count.index))}"
    Owner = "${lower(element(split("/",data.aws_caller_identity.current_user.arn),1))}"
  }
}

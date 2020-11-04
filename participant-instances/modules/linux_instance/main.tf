resource "aws_instance" "linux_instances" {
  count         = "${var.count}"
  ami           = "${data.aws_ami.ubuntu.id}"
  subnet_id     = "${var.subnet_ids[0]}"
  instance_type = "${var.instance_type}"
  key_name      = "${var.ssh_key_name}"

  vpc_security_group_ids = [
    "${aws_security_group.linux_instances.id}",
    "${var.default_security_group_id}",
  ]

  user_data = "${element(data.template_file.user_data.*.rendered, count.index)}"

  tags {
    Name  = "${var.stack_name}-${lower(element(var.animal_names,count.index))}"
    Owner = "${lower(element(split("/",data.aws_caller_identity.current_user.arn),1))}"
    CustodianOffHours = "off"
  }

  provisioner "file" {
  source      = "../../ansible-scripts"
  destination = "/tmp"

  connection {
    type     = "ssh"
    user     = "ubuntu"
    private_key = "${file("./${var.ssh_key_name}.pem")}"
    timeout  = "10m"
  }
}
}

resource "aws_security_group" "linux_instances" {
  name_prefix = "linux_instances_all"
  description = "Allow all traffic from anywhere"
  vpc_id      = "${var.vpc_id}"

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

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

  tags {
    Name = "dpg-linux_instances"
  }
}

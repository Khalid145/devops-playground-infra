data "template_file" "user" {

	template = "${file("./tpl.sql")}"

	vars {
	    guac_username = "user2"
	}

}


data "template_file" "pass" {

	template = "${file("./pass.sql")}"

	vars {
    guac_username = "user2"
		guac_password = "${sha256("password2")}"
	}
}

variable "mysql_host" {
  default = "127.0.0.1"
}
variable "mysql_user" {
  default = "root"
}
variable "mysql_pass" {
  default = "HolyGuacamole"
}
variable "mysql_db" {
  default = "guacamole_db"
}

resource "null_resource" "db_setup" {

    provisioner "local-exec" {
			command = "mysql --host ${var.mysql_host} -u${var.mysql_user} -p${var.mysql_pass} -e \"${data.template_file.user.rendered}\" -D ${var.mysql_db}"
        environment {
          # for instance, postgres would need the password here:
          PGPASSWORD = "asdf"
        }
    }

	  provisioner "local-exec" {
		  command = "mysql --host ${var.mysql_host} -u${var.mysql_user} -p${var.mysql_pass} -e \"${data.template_file.pass.rendered}\" -D ${var.mysql_db}"
		}
	
	}



output "lofaszinsha" {
  value = "${sha256("somestring")}"
}

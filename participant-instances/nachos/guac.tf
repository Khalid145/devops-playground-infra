provider "guacamole" {
  url      = "http://${data.terraform_remote_state.guac_state.instance_ip}"
  user     = "guacadmin"
  password = "7$SX0jFYSouvRa9"
}

resource "guacamole_user" "dpg_users" {
  count     = "${var.count}"
  username  = "user${count.index + 1}"
  password  = "password${count.index + 1}"
  full_name = "DPG User ${count.index + 1}"
}

resource "guacamole_connection" "vnc" {
  count                    = "${var.count}"
  name                     = "VNC-${count.index + 1}"
  parent                   = "ROOT"
  max_connections          = "1"
  max_connections_per_user = "1"
  protocol                 = "vnc"

  vnc_properties {
    hostname           = "${element(module.linux_instances.private_ip_addresses,count.index)}"
    port               = "5901"
    password           = "12345678"
    color-depth        = "24"
    clipboard-encoding = "UTF-8"
  }
}

resource "guacamole_connection" "ssh_user" {
  count                    = "${var.count}"
  name                     = "SSH-${count.index + 1}"
  parent                   = "ROOT"
  max_connections          = "2"
  max_connections_per_user = "2"
  protocol                 = "ssh"

  ssh_properties {
    hostname           = "${element(module.linux_instances.private_ip_addresses,count.index)}"
    port               = "22"
    username           = "playground"
    password           = "PandaPlay.19"
    clipboard-encoding = "UTF-8"
  }
}

resource "guacamole_connection" "ssh_admin" {
  count                    = "${var.count}"
  name                     = "ssh-admin-${count.index + 1}"
  parent                   = "ROOT"
  max_connections          = "2"
  max_connections_per_user = "2"
  protocol                 = "ssh"

  ssh_properties {
    hostname           = "${element(module.linux_instances.private_ip_addresses,count.index)}"
    port               = "22"
    username           = "ubuntu"
    private-key        = "${tls_private_key.ssh_keypair.private_key_pem}"
    clipboard-encoding = "UTF-8"
  }
}

resource "guacamole_user_connection_permissions" "perms" {
  count    = "${var.count}"
  username = "${element(guacamole_user.dpg_users.*.username, count.index)}"

  connections = [
    "${element(guacamole_connection.vnc.*.id, count.index)}",
    "${element(guacamole_connection.ssh_user.*.id, count.index)}",
  ]
  permission = "READ"
}

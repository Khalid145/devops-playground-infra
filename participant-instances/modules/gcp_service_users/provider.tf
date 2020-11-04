provider "google" {
  count       = "${var.count > 0 ? 1 : 0}"
  credentials = "${var.creds_file_data}"
  project     = "${var.project_id}"
  region      = "${var.region}"
}

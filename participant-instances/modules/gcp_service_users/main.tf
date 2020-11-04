//------ GCP

resource "google_service_account" "playground" {
  count        = "${var.count}"
  account_id   = "playground-${lower(element(var.animal_names,count.index))}"
  display_name = "DevOps Playground Service Account: ${lower(element(var.animal_names,count.index))}"
}

resource "google_service_account_key" "mykey" {
  count              = "${var.count}"
  service_account_id = "${element(google_service_account.playground.*.name, count.index)}"
  public_key_type    = "TYPE_X509_PEM_FILE"
}

resource "google_project_iam_member" "instance_admin" {
  count   = "${var.count}"
  project = "${var.project_id}"
  role    = "roles/compute.instanceAdmin"
  member  = "serviceAccount:${element(google_service_account.playground.*.email, count.index)}"
}

resource "google_project_iam_member" "user_role" {
  count   = "${var.count}"
  project = "${var.project_id}"
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${element(google_service_account.playground.*.email, count.index)}"
}

resource "google_service_account_iam_binding" "admin-account-iam" {
  count              = "${var.count}"
  service_account_id = "${element(google_service_account.playground.*.name, count.index)}"
  role               = "roles/editor"

  members = [
    "serviceAccount:${var.gcp_tf_service_user}",
  ]
}

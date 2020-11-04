resource "random_pet" "animal" {
  count  = "${var.count + 10}"
  length = 2
  separator = "-"
}

output "names" {
  value       = "${distinct(random_pet.animal.*.id)}"
  description = "List of (hopefully) unique animal names to be used elsewhere"
}

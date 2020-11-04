output "vpc_id" {
  value = "${module.vpc.vpc_id}"
}

output "vpc_subnets" {
  value = "${module.vpc.public_subnets}"
}

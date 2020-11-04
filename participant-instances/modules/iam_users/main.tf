resource "aws_iam_user" "playground" {
  count = "${var.count}"
  name  = "${var.stack_name}-user-${lower(element(var.animal_names,count.index))}"
}

resource "aws_iam_access_key" "playground" {
  count = "${var.count}"
  user  = "${element(aws_iam_user.playground.*.name,count.index)}"
}

resource "aws_iam_group" "playground_grp" {
  count = "${var.count > 0 ? 1 : 0}"

  name = "${var.stack_name}-group"
  path = "/users/"
}

resource "aws_iam_user_group_membership" "grp-assoc" {
  count = "${var.count}"
  user  = "${element(aws_iam_user.playground.*.name,count.index)}"

  groups = [
    "${aws_iam_group.playground_grp.name}",
  ]
}

resource "aws_iam_policy" "policy" {
  count = "${var.count > 0 ? 1 : 0}"

  name        = "${var.stack_name}-grp-policy"
  description = "Policy for the playground"
  policy      = "${var.iam_policy}"
}

resource "aws_iam_group_policy_attachment" "policy-attach" {
  count      = "${var.count > 0 ? 1 : 0}"
  group      = "${aws_iam_group.playground_grp.name}"
  policy_arn = "${aws_iam_policy.policy.arn}"
}

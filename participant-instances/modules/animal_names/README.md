# DPG - Animal Names Module

This module's purpose is to create a list of animal names, for further use.

It always creates **N + 10** names then returns a de-duplicated list of the names. The idea is, that in case the randomizer returns the same names, after deduplication there still should be enough number of animal names.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| count | How many animal names should be generated. Please note that 10 more will be generated to allow duplicates | string | `"1"` | no |

## Outputs

| Name | Description |
|------|-------------|
| names | List of (hopefully) unique animal names to be used elsewhere |



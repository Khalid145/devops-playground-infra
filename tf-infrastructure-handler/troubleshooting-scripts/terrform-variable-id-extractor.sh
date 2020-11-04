export org="ECSD-DPG"
export workspace="playground-infra-ui-nachos"

curl \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/vnd.api+json" \
"https://app.terraform.io/api/v2/vars?filter%5Borganization%5D%5Bname%5D=${org}&filter%5Bworkspace%5D%5Bname%5D=${workspace}"

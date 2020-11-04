# Terraform Cloud only allows destroy plans to be executed via the API. This script will trigger a destroy plan based on the workspace ID.
template='{
    "data": {
        "attributes": {
            "is-destroy": "%s",
            "message": "%s"
            },
            "type":"runs",
            "relationships": {
                "workspace": {
                    "data": {
                        "type": "workspaces",
                        "id": "%s"
                    }
                }
            }
        }
    }'

json_string=$(printf "$template" "true" "Destroy Plan From Lambda function." "ws-9cNPf39s4376pbUo")

# echo "$json_string"

echo "$json_string" > payload.json

curl \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/vnd.api+json" \
  --request POST \
  --data @payload.json \
  https://app.terraform.io/api/v2/runs

rm -rf payload.json
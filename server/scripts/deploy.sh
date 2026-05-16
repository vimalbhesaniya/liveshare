#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Load MongoDB and app env from project root
if [ -f ../.env ]; then
  set -a
  # shellcheck disable=SC1091
  source ../.env
  set +a
fi

# Use AWS login session (from Serverless/AWS console sign-in)
export AWS_SDK_LOAD_CONFIG=1
export AWS_PROFILE="${AWS_PROFILE:-default}"
export PATH="${HOME}/.local/bin:${PATH}"

if command -v aws >/dev/null 2>&1; then
  # Serverless v3 needs env vars; export-credentials converts login session
  eval "$(aws configure export-credentials --profile "$AWS_PROFILE" --format env)"
  unset AWS_PROFILE
else
  echo "Error: AWS CLI not found. Install it: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

if [ -z "${MONGODB_URI:-}" ] && [ -z "${SNIPPETS_TABLE:-}" ]; then
  echo "Note: Lambda uses DynamoDB (SNIPPETS_TABLE) — MongoDB optional for local dev only."
fi

echo "Deploying liveshare-api..."
npx serverless deploy --stage "${1:-dev}"

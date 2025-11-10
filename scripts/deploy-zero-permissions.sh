#!/bin/bash
set -e

echo "Generating Zero permissions SQL..."
npx zero-deploy-permissions -p ./src/zero/zero-schema.ts --output-format=sql > /tmp/zero-permissions.sql

echo "SQL file generated at /tmp/zero-permissions.sql"
echo ""
echo "To apply these permissions, you need to:"
echo "1. Connect to your RDS database through the VPC (e.g., using SSM Session Manager or a bastion host)"
echo "2. Run: psql -h <your-db-host> -U <username> -d <database> -f /tmp/zero-permissions.sql"
echo ""
echo "Alternatively, if you have VPC access configured, you can set ZERO_UPSTREAM_DB and run:"
echo "npx zero-deploy-permissions -p ./src/zero/zero-schema.ts"

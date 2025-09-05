#!/bin/bash

# Script to update import paths after folder restructuring
# This updates all TypeScript/React files to use new layer-based structure

cd "/mnt/c/Users/hassa/OneDrive/Desktop/Bayaan/bayaan VA dashboard/bayaan-dashboard/src/app"

echo "Updating foundation component imports..."

# Update foundation components
find foundation/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./hooks/|from "../hooks/|g'
find foundation/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./types"|from "../../shared/types/types"|g'
find foundation/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./lib/|from "../../shared/lib/|g'
find foundation/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/app/contexts/|from "@/app/foundation/contexts/|g'
find foundation/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/app/hooks/|from "@/app/foundation/hooks/|g'

echo "Updating foundation hooks..."

# Update foundation hooks
find foundation/hooks -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./types"|from "../../shared/types/types"|g'
find foundation/hooks -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./lib/|from "../../shared/lib/|g'
find foundation/hooks -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./contexts/|from "../contexts/|g'
find foundation/hooks -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./services/|from "../services/|g'

echo "Updating dashboard components..."

# Update dashboard components
find dashboard/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/app/components/ui/|from "@/app/shared/components/|g'
find dashboard/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "@/app/lib/|from "@/app/shared/lib/|g'
find dashboard/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./\.\./lib/|from "../../../shared/lib/|g'

echo "Updating development components..."

# Update dev components
find dev/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./services/|from "../../foundation/services/|g'
find dev/components -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from "\.\./hooks/|from "../../foundation/hooks/|g'

echo "Import path updates completed!"
#!/bin/bash
# Fix for @xixixao/uploadstuff React 19 compatibility
# This script fixes the useRef issue in the uploadstuff package

UPLOADSTUFF_FILE="node_modules/@xixixao/uploadstuff/lib/useEvent.ts"

if [ -f "$UPLOADSTUFF_FILE" ]; then
    echo "Fixing @xixixao/uploadstuff React 19 compatibility..."
    sed -i '' 's/const stableRef = useRef<TCallback>();/const stableRef = useRef<TCallback | undefined>(undefined);/' "$UPLOADSTUFF_FILE"
    echo "✅ Fixed @xixixao/uploadstuff useRef issue"
else
    echo "⚠️  @xixixao/uploadstuff useEvent.ts file not found at $UPLOADSTUFF_FILE"
fi 

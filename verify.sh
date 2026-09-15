#!/bin/bash
echo "START_VERIFY"
cd /root/.joyclaw/workspace/hotspot-radar-updated
echo "SEC1_DATA_DIR"
ls -la data/
echo "SEC2_ALL_JSON"
ls -1 *.json data/*.json
echo "SEC3_HOTSPOT_FILES"
find . -maxdepth 3 \( -name "*hotspot*" -o -name "*score*" -o -name "*daily*" \) 2>/dev/null
echo "SEC4_SCRIPT"
cat deploy-daily.sh
echo "SEC5_GITLOG"
cd /root/.joyclaw/workspace && git log --oneline -6
echo "END_VERIFY"
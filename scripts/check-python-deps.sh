#!/bin/bash
# Script to check and install Python dependencies at runtime if needed
# This ensures uptime-kuma-api is available even if build-time installation failed

echo "[check-python-deps] Checking Python dependencies..."

# Check if uptime-kuma-api is installed
python3 -c "import uptime_kuma_api" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[check-python-deps] uptime-kuma-api not found, installing..."
    python3 -m pip install --quiet -r requirements.txt || pip3 install --quiet -r requirements.txt
    if [ $? -eq 0 ]; then
        echo "[check-python-deps] Python dependencies installed successfully"
    else
        echo "[check-python-deps] WARNING: Failed to install Python dependencies"
    fi
else
    echo "[check-python-deps] Python dependencies already installed"
fi

# Verify installation
python3 -c "import uptime_kuma_api; print('uptime-kuma-api version:', uptime_kuma_api.__version__)" 2>/dev/null || echo "[check-python-deps] WARNING: Could not verify uptime-kuma-api installation"


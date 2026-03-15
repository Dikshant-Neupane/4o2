import os
import sys
import requests
from pathlib import Path

# Need an image to test with
img_dir = Path("datasets/yolo_potholes/images/test")
if not img_dir.exists():
    img_dir = Path("Data/potholes")

img_files = list(img_dir.glob("*.jpg"))
if not img_files:
    print("Could not find any test images to send.")
    sys.exit(1)

test_image = img_files[0]
print(f"Testing with image: {test_image}")

# Assuming server is running on port 8002
url = "http://127.0.0.1:8002/api/ai/predict"

try:
    with open(test_image, "rb") as f:
        files = {"file": (test_image.name, f, "image/jpeg")}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Error connecting to server: {e}")
    sys.exit(1)

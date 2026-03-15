import requests
import sys

# Assuming server is running on port 8003
url = "http://127.0.0.1:8003/api/datasets"

payload = {
    "name": "yolo_test2",
    "description": "Mock dataset for testing yolo training",
    "file_path": "Data/potholes"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    dataset_id = response.json().get("id")
    print(response.json())
    
    if dataset_id:
        url_train = "http://127.0.0.1:8003/api/ai/train"
        payload_train = {
            "dataset_id": dataset_id,
            "model_type": "yolov8n.pt",
            "epochs": 1,
            "batch_size": 2,
            "learning_rate": 0.001
        }
        resp_train = requests.post(url_train, json=payload_train)
        print(f"Train Status Code: {resp_train.status_code}")
        print("Train Response JSON:")
        print(resp_train.json())
        
except Exception as e:
    print(f"Error connecting to server: {e}")
    sys.exit(1)

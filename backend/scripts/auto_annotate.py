import cv2
import os
import glob
from pathlib import Path

def auto_annotate_potholes(data_dir):
    """
    Scans a directory of pothole images and uses an OpenCV-based heuristic 
    to guess the bounding box of the pothole, generating YOLO .txt annotations.
    """
    image_paths = glob.glob(os.path.join(data_dir, "*.jpg"))
    print(f"Found {len(image_paths)} images in {data_dir}. Starting auto-annotation...")
    
    annotated_count = 0
    
    for img_path in image_paths:
        img = cv2.imread(img_path)
        if img is None:
            continue
            
        # Ignore our dummy synthetic files from phase 2
        p = Path(img_path)
        if p.name.startswith("_synthetic"):
            continue
            
        h, w, _ = img.shape
        
        # Super simple heuristic for Potholes:
        # Convert to grayscale, blur, threshold to find dark anomalies
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (15, 15), 0)
        
        # Adaptive thresholding to find dark regions (potholes) against lighter road
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 51, 10
        )
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        best_box = None
        max_area = 0
        
        for contour in contours:
            area = cv2.contourArea(contour)
            x, y, bw, bh = cv2.boundingRect(contour)
            
            # Filter contours based on size to avoid noise
            # A pothole is likely between 2% and 40% of the image
            if (0.02 * w * h) < area < (0.4 * w * h):
                if area > max_area:
                    max_area = area
                    best_box = (x, y, bw, bh)
                    
        # If no suitable contour found, fallback to central 50% box
        if best_box is None:
            center_x, center_y = 0.5, 0.5
            box_w, box_h = 0.5, 0.5
        else:
            # Convert to YOLO normalized format: x_center, y_center, width, height
            x, y, bw, bh = best_box
            center_x = (x + bw / 2.0) / w
            center_y = (y + bh / 2.0) / h
            box_w = bw / w
            box_h = bh / h
            
            # Clamp values between 0 and 1
            center_x = max(0.0, min(1.0, center_x))
            center_y = max(0.0, min(1.0, center_y))
            box_w = max(0.0, min(1.0, box_w))
            box_h = max(0.0, min(1.0, box_h))
            
        # Write .txt file (Class 0 is pothole)
        txt_path = p.with_suffix(".txt")
        with open(txt_path, "w") as f:
            f.write(f"0 {center_x:.6f} {center_y:.6f} {box_w:.6f} {box_h:.6f}\n")
            
        annotated_count += 1
        
    print(f"Successfully generated {annotated_count} YOLO annotation files in {data_dir}!")

if __name__ == "__main__":
    import sys
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "Data/potholes"
    auto_annotate_potholes(data_dir)

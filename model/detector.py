import os
import random
from PIL import Image, ImageDraw

def generate_heatmap(image_path, output_path):
    """
    Generates a mock heatmap highlighting suspicious regions using Pillow.
    This replaces heavy OpenCV (cv2) processing for a lightweight setup.
    """
    try:
        with Image.open(image_path).convert('RGBA') as img:
            overlay = Image.new('RGBA', img.size, (255, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            w, h = img.size
            
            # Draw semi-transparent red box in the center-ish area
            center_x, center_y = w // 2, h // 2
            draw.rectangle(
                [center_x - 50, center_y - 50, center_x + 50, center_y + 50],
                fill=(255, 0, 0, 100) # Red with alpha
            )
            
            # Blend the overlay with the original image
            highlighted_img = Image.alpha_composite(img, overlay)
            highlighted_img.convert('RGB').save(output_path)
            return True
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        return False

def analyze_image(image_path):
    """
    Analyzes the image and returns a prediction and confidence.
    If the image is suspicious, it also generates a highlighted version.
    """
    # Predictable mock logic for demonstration purposes (No heavy AI model needed)
    filename = os.path.basename(image_path).lower()
    
    # If the filename contains 'fake', 'manipulated', or 'suspicious', flag it as a deepfake.
    if any(word in filename for word in ['fake', 'manipulated', 'suspicious']):
        is_safe = False
    else:
        is_safe = True
        
    result = "SAFE" if is_safe else "SUSPICIOUS"
    confidence = random.randint(85, 98)

    response = {
        "status": result,
        "confidence": confidence,
    }

    if result == "SAFE":
        response["explanations"] = [
            "No manipulation detected.",
            "Image patterns are consistent.",
            "No suspicious artifacts found."
        ]
    else:
        response["explanations"] = [
            "Facial inconsistency detected.",
            "Pixel-level artifacts found.",
            "Blending or distortion observed."
        ]
        
        # Generate highlighted image
        highlighted_filename = 'highlighted_' + os.path.basename(image_path)
        highlighted_path = os.path.join(os.path.dirname(image_path), highlighted_filename)
        generate_heatmap(image_path, highlighted_path)
        response["highlighted_image_url"] = f"/static/uploads/{highlighted_filename}"

    return response

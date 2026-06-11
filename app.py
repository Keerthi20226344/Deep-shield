import os
import uuid
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from model.detector import analyze_image

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Generate a unique filename to prevent collisions but preserve original name
        original_name = secure_filename(file.filename)
        filename = f"{uuid.uuid4().hex}_{original_name}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze the image
        try:
            result = analyze_image(filepath)
            
            # Add original image URL to result
            result['original_image_url'] = f"/{filepath.replace(chr(92), '/')}" 
            
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Invalid file type. Only JPG, JPEG, and PNG are allowed."}), 400

if __name__ == '__main__':
    app.run(debug=True)

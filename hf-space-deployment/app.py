"""
Gradio app for Dog Skin Disease Detection and Severity Classification
"""
import gradio as gr
import torch
from PIL import Image
import os
from model_utils import load_model, predict, device, LABEL_MAPPINGS
from fastapi import File, UploadFile
from fastapi.responses import JSONResponse
import io

# Global model variable
model = None
image_size = 224

def find_model_file():
    """Search for model file in common locations"""
    model_name = 'dog_skin_disease_model.pth'
    
    # Debug: Print current working directory and list files
    cwd = os.getcwd()
    print(f"Current working directory: {cwd}")
    
    # List files in current directory
    try:
        files_in_cwd = os.listdir(cwd)
        print(f"Files in current directory ({len(files_in_cwd)} files):")
        for f in files_in_cwd[:20]:  # Show first 20 files
            print(f"  - {f}")
        if len(files_in_cwd) > 20:
            print(f"  ... and {len(files_in_cwd) - 20} more files")
    except Exception as e:
        print(f"Error listing current directory: {e}")
    
    # Check if /app exists and list its contents
    if os.path.exists('/app'):
        try:
            files_in_app = os.listdir('/app')
            print(f"\nFiles in /app ({len(files_in_app)} files):")
            for f in files_in_app[:20]:
                print(f"  - {f}")
            if len(files_in_app) > 20:
                print(f"  ... and {len(files_in_app) - 20} more files")
        except Exception as e:
            print(f"Error listing /app: {e}")
    
    # Try to load model from different possible locations
    model_paths = [
        '/app/dog_skin_disease_model.pth',         # Docker root (most likely)
        './dog_skin_disease_model.pth',            # Current directory
        'dog_skin_disease_model.pth',              # Relative path
        os.path.join(cwd, 'dog_skin_disease_model.pth'),  # Absolute from cwd
        '/app/models/dog_skin_disease_model.pth',  # Docker models folder
        './models/dog_skin_disease_model.pth',     # Local models folder
        'models/dog_skin_disease_model.pth',       # Relative models folder
    ]
    
    # Also search recursively in common directories
    search_dirs = [cwd, '/app']
    for search_dir in search_dirs:
        if os.path.exists(search_dir):
            for root, dirs, files in os.walk(search_dir):
                # Limit depth to avoid searching too much
                depth = root[len(search_dir):].count(os.sep)
                if depth > 2:
                    continue
                if model_name in files:
                    found_path = os.path.join(root, model_name)
                    if found_path not in model_paths:
                        model_paths.append(found_path)
    
    print(f"\nSearching for model file: {model_name}")
    model_path = None
    for path in model_paths:
        abs_path = os.path.abspath(path)
        exists = os.path.exists(path)
        size = os.path.getsize(path) / (1024*1024) if exists else 0
        print(f"  Checking: {path}")
        print(f"    -> Absolute: {abs_path}")
        print(f"    -> Exists: {exists}, Size: {size:.2f} MB" if exists else f"    -> Exists: {exists}")
        if exists:
            model_path = path
            print(f"✅ Found model at: {path} ({size:.2f} MB)")
            break
    
    return model_path

def initialize_model():
    """Initialize the model on startup"""
    global model, image_size
    
    # Search for model file
    model_path = find_model_file()
    
    if model_path is None:
        # Last resort: search for any .pth files
        print("\n⚠️  Model file not found with exact name. Searching for .pth files...")
        search_dirs = [os.getcwd(), '/app']
        pth_files = []
        for search_dir in search_dirs:
            if os.path.exists(search_dir):
                for root, dirs, files in os.walk(search_dir):
                    depth = root[len(search_dir):].count(os.sep) if search_dir != root else 0
                    if depth > 2:
                        continue
                    for file in files:
                        if file.endswith('.pth'):
                            pth_path = os.path.join(root, file)
                            size = os.path.getsize(pth_path) / (1024*1024)
                            pth_files.append((pth_path, size))
        
        if pth_files:
            print(f"Found {len(pth_files)} .pth file(s):")
            for path, size in pth_files:
                print(f"  - {path} ({size:.2f} MB)")
            # Use the largest .pth file (likely the model)
            model_path = max(pth_files, key=lambda x: x[1])[0]
            print(f"✅ Using largest .pth file: {model_path}")
        else:
            print(f"❌ Error: No .pth files found.")
            print("Please ensure the model file 'dog_skin_disease_model.pth' is uploaded to the Space.")
            return False
    
    try:
        model, image_size = load_model(model_path, device)
        print("Model initialized successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def predict_skin_disease(image):
    """Main prediction function for Gradio interface"""
    global model
    
    if model is None:
        # Try to load model if not loaded
        if not initialize_model():
            return {"error": "Model not loaded. Please upload `dog_skin_disease_model.pth` to the Space and restart."}
    
    if image is None:
        return {"error": "Please upload an image."}
    
    try:
        # Make prediction
        result = predict(image, model, image_size, device)
        
        # Return JSON format for easier parsing
        return {
            "success": True,
            "disease": result['disease'],
            "stage": result['stage'],
            "disease_confidence": result['disease_confidence'],
            "stage_confidence": result['stage_confidence'],
            "combined_confidence": result['combined_confidence'],
            "all_disease_probabilities": result.get('all_disease_probabilities', {}),
            "all_stage_probabilities": result.get('all_stage_probabilities', {}),
        }
        
    except Exception as e:
        return {"error": f"Error during prediction: {str(e)}"}

# Initialize model on startup
print("Initializing model...")
model_loaded = initialize_model()
if not model_loaded:
    print("⚠️  Model not loaded. Please upload the model file to the Space.")

# Create Gradio interface
with gr.Blocks(title="Dog Skin Disease Detection") as demo:
    gr.Markdown("""
    # 🐕 Dog Skin Disease Detection & Severity Classification
    
    This AI model detects skin diseases in dogs and classifies their severity (mild or severe).
    
    **Features:**
    - Detects 5 types of skin diseases: Allergic Dermatitis, Bacterial Dermatosis, Fungal Infections, Ringworm, and Healthy
    - Classifies severity: Mild, Severe, or None (for healthy)
    - Provides confidence scores for all predictions
    
    **How to use:**
    1. Upload an image of a dog's skin
    2. Click "Analyze" to get predictions
    3. View the disease type, severity, and confidence scores
    """)
    
    with gr.Row():
        with gr.Column():
            image_input = gr.Image(
                type="pil",
                label="Upload Dog Skin Image",
                height=400
            )
            analyze_btn = gr.Button("🔍 Analyze Image", variant="primary", size="lg")
        
        with gr.Column():
            output = gr.JSON(label="Prediction Results")
    
    # Examples section
    gr.Markdown("### 📸 Example Images")
    gr.Examples(
        examples=[],  # Add example images if available
        inputs=image_input,
        outputs=output,
        fn=predict_skin_disease,
        cache_examples=False
    )
    
    # Connect button to function with API name for external access
    analyze_btn.click(
        fn=predict_skin_disease,
        inputs=image_input,
        outputs=output,
        api_name="predict"  # This exposes the function as /api/predict
    )
    
    # Auto-predict on image upload
    image_input.upload(
        fn=predict_skin_disease,
        inputs=image_input,
        outputs=output
    )

# Define API endpoint function
async def api_predict(file: UploadFile = File(...)):
    """Direct API endpoint for predictions"""
    global model
    
    if model is None:
        if not initialize_model():
            return JSONResponse(
                status_code=503,
                content={"error": "Model not loaded. Please check the Space logs."}
            )
    
    try:
        # Read image from upload
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Make prediction
        result = predict(image, model, image_size, device)
        
        return JSONResponse(content={
            "success": True,
            "disease": result['disease'],
            "stage": result['stage'],
            "disease_confidence": result['disease_confidence'],
            "stage_confidence": result['stage_confidence'],
            "combined_confidence": result['combined_confidence'],
            "all_disease_probabilities": result.get('all_disease_probabilities', {}),
            "all_stage_probabilities": result.get('all_stage_probabilities', {}),
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Prediction failed: {str(e)}"}
        )

# Register the API route with Gradio's FastAPI app
# This must be done after demo is created but before launch
demo.app.add_api_route("/api/predict", api_predict, methods=["POST"])

# Add a test endpoint to verify API is working
@demo.app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is accessible"""
    return JSONResponse(content={"status": "ok", "message": "API is working"})

print("✅ API routes registered:")
print("  - POST /api/predict")
print("  - GET /api/test")

# Launch the app
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        theme=gr.themes.Soft()
    )


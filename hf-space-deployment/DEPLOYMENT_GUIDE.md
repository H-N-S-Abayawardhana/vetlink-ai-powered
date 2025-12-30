# Deployment Guide for Hugging Face Spaces

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Files

1. **Create a new directory** for your Hugging Face Space files
2. **Copy the following files** to this directory:
   - `Dockerfile`
   - `app.py`
   - `model_utils.py`
   - `requirements.txt`
   - `README.md`
   - `.dockerignore`

### Step 2: Create Hugging Face Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in the details:
   - **Space name**: `dog-skin-disease-detection` (or your preferred name)
   - **SDK**: Select **"Docker"**
   - **Visibility**: Public or Private
   - **Hardware**: Choose based on your needs:
     - CPU basic (free)
     - CPU upgrade (if needed)
     - GPU (if you want faster inference)
4. Click **"Create Space"**

### Step 3: Upload Files

1. In your new Space, go to the **"Files"** tab
2. Click **"Add file"** → **"Upload file"**
3. Upload all the files:
   - `Dockerfile`
   - `app.py`
   - `model_utils.py`
   - `requirements.txt`
   - `README.md`
   - `.dockerignore`

### Step 4: Upload Model File

1. In the Space, go to **"Files"** tab
2. Create a folder named `models` (or upload directly to root)
3. Upload your `dog_skin_disease_model.pth` file
   - You can upload it to `/models/` or root directory
   - The app will automatically find it

### Step 5: Configure Space Settings

1. Go to **"Settings"** tab in your Space
2. Configure:
   - **Hardware**: Select appropriate hardware
   - **Environment variables**: Not needed for basic setup
   - **Docker**: Should be automatically detected

### Step 6: Build and Deploy

1. The Space will automatically start building when you upload files
2. Go to **"Logs"** tab to see the build progress
3. Wait for the build to complete (usually 5-10 minutes)
4. Once built, the app will be available at: `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`

### Step 7: Test Your Deployment

1. Open your Space URL
2. Upload a test image
3. Click "Analyze Image"
4. Verify the predictions are working correctly

## Troubleshooting

### Model Not Found Error

If you get "Model file not found":
1. Check that `dog_skin_disease_model.pth` is uploaded
2. Verify the file path in `app.py` matches your upload location
3. Check the file size (should be ~350MB for the model)

### Build Errors

1. Check the **"Logs"** tab for error messages
2. Common issues:
   - Missing dependencies in `requirements.txt`
   - Docker build errors
   - Python version mismatch

### Memory Issues

If you get out-of-memory errors:
1. Upgrade to a higher hardware tier
2. Reduce batch size in inference (currently 1)
3. Use CPU instead of GPU if needed

## File Structure

Your Space should have this structure:

```
your-space/
├── Dockerfile
├── app.py
├── model_utils.py
├── requirements.txt
├── README.md
├── .dockerignore
└── models/
    └── dog_skin_disease_model.pth
```

## Updating Your Space

1. Make changes to your files locally
2. Upload the updated files to your Space
3. The Space will automatically rebuild
4. Wait for the rebuild to complete

## Customization

### Change App Title/Description

Edit the `README.md` file and the markdown in `app.py`

### Add Example Images

1. Upload example images to your Space
2. Update the `gr.Examples()` section in `app.py` with image paths

### Modify UI

Edit the Gradio interface in `app.py` to customize:
- Colors
- Layout
- Input/output formats
- Additional features

## Support

For issues or questions:
1. Check Hugging Face Spaces documentation
2. Review the logs in your Space
3. Check the model loading and prediction code


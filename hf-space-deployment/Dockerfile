# Dockerfile for Dog Skin Disease Detection Model
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# Note: libgl1-mesa-glx is not needed for CPU inference
# Using libgl1 for newer Debian versions, or removing if not needed
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY model_utils.py .
COPY README.md .

# Copy model file (must be in repository root)
# The model file should be uploaded to the Space repository
COPY dog_skin_disease_model.pth .

# Create directory for model (backup location)
RUN mkdir -p /app/models

# Expose port (Gradio default)
EXPOSE 7860

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GRADIO_SERVER_NAME=0.0.0.0
ENV GRADIO_SERVER_PORT=7860

# Run the application
CMD ["python", "app.py"]


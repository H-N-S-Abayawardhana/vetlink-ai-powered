---
title: Dog Skin Disease Detection
emoji: 🐕
colorFrom: blue
colorTo: purple
sdk: docker
sdk_version: latest
app_file: app.py
pinned: false
license: mit
---

# 🐕 Dog Skin Disease Detection & Severity Classification

An AI-powered system for detecting skin diseases in dogs and classifying their severity using DINOv2 + Vision Transformer.

## 🎯 Features

- **Disease Detection**: Identifies 5 types of skin conditions:
  - Allergic Dermatitis
  - Bacterial Dermatosis
  - Fungal Infections
  - Ringworm
  - Healthy (no disease)

- **Severity Classification**: Classifies disease severity as:
  - **Mild**: Early stage or less severe symptoms
  - **Severe**: Advanced stage or more severe symptoms
  - **None**: For healthy skin

- **High Accuracy**: 
  - Disease Classification: ~99% accuracy
  - Stage Classification: ~98% accuracy
  - Combined Classification: ~98% accuracy

## 🏗️ Model Architecture

- **Backbone**: DINOv2 (facebook/dinov2-base)
- **Classifier**: Custom Vision Transformer heads
- **Input Size**: 224x224 pixels
- **Total Parameters**: ~87.5M

## 📊 Performance

The model was trained on a dataset of 7,200 dog skin images with the following performance:

- **Test Set Accuracy**:
  - Disease: 99.17%
  - Stage: 98.43%
  - Combined: 98.06%

## 🚀 Usage

1. Upload an image of a dog's skin
2. Click "Analyze Image"
3. View the prediction results including:
   - Detected disease type
   - Severity level (mild/severe)
   - Confidence scores
   - All probability distributions

## 📝 Model Files

To use this Space, you need to upload the model file:
- `dog_skin_disease_model.pth` - The trained model weights

Place the model file in the `/app/models/` directory or root directory.

## 🔧 Technical Details

- **Framework**: PyTorch
- **Inference**: CPU/GPU compatible
- **Deployment**: Docker container
- **Interface**: Gradio

## ⚠️ Disclaimer

This tool is for educational and research purposes. Always consult with a licensed veterinarian for professional diagnosis and treatment of your pet's health issues.

## 📄 License

MIT License


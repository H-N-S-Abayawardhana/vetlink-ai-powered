"""
Model utilities for loading and inference
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoModel
from PIL import Image
import torchvision.transforms as transforms
import numpy as np

# Device configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Label mappings (must match training)
DISEASE_CLASSES = [
    'allergic_dermatitis',
    'bacterial_dermatosis', 
    'fungal_infections',
    'healthy',
    'ringworm'
]

STAGE_CLASSES = ['mild', 'severe', 'none']

# Create label mappings
def create_label_mappings():
    disease_to_idx = {disease: idx for idx, disease in enumerate(DISEASE_CLASSES)}
    idx_to_disease = {idx: disease for disease, idx in disease_to_idx.items()}
    
    stage_to_idx = {'mild': 0, 'severe': 1, 'none': 2}
    idx_to_stage = {0: 'mild', 1: 'severe', 2: 'none'}
    
    combined_classes = []
    for disease in DISEASE_CLASSES:
        if disease == 'healthy':
            combined_classes.append(f"{disease}_none")
        else:
            combined_classes.append(f"{disease}_mild")
            combined_classes.append(f"{disease}_severe")
    
    combined_to_idx = {cls: idx for idx, cls in enumerate(combined_classes)}
    idx_to_combined = {idx: cls for cls, idx in combined_to_idx.items()}
    
    return {
        'disease_to_idx': disease_to_idx,
        'idx_to_disease': idx_to_disease,
        'stage_to_idx': stage_to_idx,
        'idx_to_stage': idx_to_stage,
        'combined_to_idx': combined_to_idx,
        'idx_to_combined': idx_to_combined,
        'num_diseases': len(DISEASE_CLASSES),
        'num_stages': len(STAGE_CLASSES),
        'num_combined': len(combined_classes)
    }

LABEL_MAPPINGS = create_label_mappings()

# Model Architecture (must match training)
class DogSkinDiseaseClassifier(nn.Module):
    """DINOv2 + ViT based model for dog skin disease classification"""
    
    def __init__(self, dino_backbone, num_diseases, num_stages, dino_feature_dim, dropout=0.3):
        super(DogSkinDiseaseClassifier, self).__init__()
        
        self.dino_backbone = dino_backbone
        self.dino_feature_dim = dino_feature_dim
        
        # Disease classification head
        self.disease_classifier = nn.Sequential(
            nn.LayerNorm(dino_feature_dim),
            nn.Dropout(dropout),
            nn.Linear(dino_feature_dim, 512),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(512, num_diseases)
        )
        
        # Stage classification head
        self.stage_classifier = nn.Sequential(
            nn.LayerNorm(dino_feature_dim),
            nn.Dropout(dropout),
            nn.Linear(dino_feature_dim, 256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_stages)
        )
        
        # Combined classification head
        self.combined_classifier = nn.Sequential(
            nn.LayerNorm(dino_feature_dim),
            nn.Dropout(dropout),
            nn.Linear(dino_feature_dim, 512),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(512, num_diseases * 2 + 1)
        )
        
    def forward(self, x):
        dino_output = self.dino_backbone(x)
        cls_token = dino_output.last_hidden_state[:, 0, :]
        
        disease_logits = self.disease_classifier(cls_token)
        stage_logits = self.stage_classifier(cls_token)
        combined_logits = self.combined_classifier(cls_token)
        
        return {
            'disease_logits': disease_logits,
            'stage_logits': stage_logits,
            'combined_logits': combined_logits
        }

# Image preprocessing
def get_transforms(image_size=224):
    """Get image preprocessing transforms"""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])

# Model loading function
def load_model(model_path, device=device):
    """Load the trained model"""
    print(f"Loading model from {model_path}...")
    print(f"Using device: {device}")
    
    # Load checkpoint
    # weights_only=False is safe here since this is our own trained model
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    
    # Get config
    config = checkpoint.get('config', {})
    dino_model = config.get('dino_model', 'facebook/dinov2-base')
    image_size = config.get('image_size', 224)
    
    # Load DINOv2 backbone
    print(f"Loading DINOv2 backbone: {dino_model}")
    dino_backbone = AutoModel.from_pretrained(dino_model).to(device)
    
    # Get feature dimension
    with torch.no_grad():
        dummy_input = torch.randn(1, 3, image_size, image_size).to(device)
        dummy_output = dino_backbone(dummy_input)
        dino_feature_dim = dummy_output.last_hidden_state.shape[-1]
    
    # Create model
    model = DogSkinDiseaseClassifier(
        dino_backbone=dino_backbone,
        num_diseases=LABEL_MAPPINGS['num_diseases'],
        num_stages=LABEL_MAPPINGS['num_stages'],
        dino_feature_dim=dino_feature_dim,
        dropout=0.3
    ).to(device)
    
    # Fix combined classifier output size
    model.combined_classifier[-1] = nn.Linear(512, LABEL_MAPPINGS['num_combined']).to(device)
    
    # Load state dict
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    print("Model loaded successfully!")
    return model, image_size

# Prediction function
def predict(image, model, image_size=224, device=device):
    """Make prediction on a single image"""
    # Preprocess image
    transform = get_transforms(image_size)
    
    # Convert PIL to RGB if needed
    if isinstance(image, Image.Image):
        image = image.convert('RGB')
    else:
        image = Image.fromarray(image).convert('RGB')
    
    # Transform
    image_tensor = transform(image).unsqueeze(0).to(device)
    
    # Predict
    with torch.no_grad():
        outputs = model(image_tensor)
        
        # Get probabilities
        disease_probs = F.softmax(outputs['disease_logits'], dim=1).cpu().numpy()[0]
        stage_probs = F.softmax(outputs['stage_logits'], dim=1).cpu().numpy()[0]
        combined_probs = F.softmax(outputs['combined_logits'], dim=1).cpu().numpy()[0]
        
        # Get predictions
        disease_pred = disease_probs.argmax()
        stage_pred = stage_probs.argmax()
        combined_pred = combined_probs.argmax()
        
        # Get confidence scores
        disease_confidence = disease_probs[disease_pred] * 100
        stage_confidence = stage_probs[stage_pred] * 100
        combined_confidence = combined_probs[combined_pred] * 100
        
        # Get class names
        disease_name = LABEL_MAPPINGS['idx_to_disease'][disease_pred]
        stage_name = LABEL_MAPPINGS['idx_to_stage'][stage_pred]
        combined_name = LABEL_MAPPINGS['idx_to_combined'][combined_pred]
        
        # Get all probabilities
        all_disease_probs = {
            LABEL_MAPPINGS['idx_to_disease'][i]: float(disease_probs[i] * 100)
            for i in range(len(DISEASE_CLASSES))
        }
        
        all_stage_probs = {
            LABEL_MAPPINGS['idx_to_stage'][i]: float(stage_probs[i] * 100)
            for i in range(len(STAGE_CLASSES))
        }
    
    return {
        'disease': disease_name,
        'stage': stage_name,
        'combined': combined_name,
        'disease_confidence': float(disease_confidence),
        'stage_confidence': float(stage_confidence),
        'combined_confidence': float(combined_confidence),
        'all_disease_probabilities': all_disease_probs,
        'all_stage_probabilities': all_stage_probs
    }


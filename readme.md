 📌 Overview of the Project

This project is an AI-powered pet healthcare system designed to assist pet owners in identifying dog skin diseases and receiving basic care guidance through an intelligent, user-friendly platform. The system integrates computer vision models for disease detection, LLM-based knowledge generation for explanations and care tips, and cloud services for data storage and report management.

📂 **GitHub Repository:**      [https://github.com/H-N-S-Abayawardhana/vetlink-ai-powered]
🚀 **Live Demo / Deployment:** [https://vet-link.vercel.app/]

🏗️ System Architecture

The overall system follows a modular, service-oriented architecture, separating the user interface, AI/ML services, LLM integration, and storage components to ensure scalability and maintainability.

Architecture Diagram:
🔗 Draw.io System Architecture – [https://drive.google.com/file/d/1qwxUK4363bIKMenpspJjJ22fCEM8bsJa/view?usp=sharing]


⚙️ Project Dependencies

Frontend: Web / Mobile UI (Image upload, result visualization, report download)

ML Models:
        - DINOv2 + Vision Transformer (ViT) (Skin disease detection and severity classify)

Backend Services: API layer for detection, history management, and reporting

Storage: Amazon S3 (images and videos)

Database: Pet health records and detection history

LLM Integration: For explanations and care guidance


🐶 Dog Skin Disease Detection & Care Guidance Component

This component enables pet owners to detect dog skin diseases by uploading an affected skin image through the user interface. The system uses a DINOv2 + Vision Transformer (ViT)–based machine learning model to identify the type of skin disease and classify its severity level (mild or severe).

Once the detection is completed, the results are displayed in the UI, and an LLM-powered guidance module generates human-readable explanations, including disease information, severity meaning, and basic pet care tips. If the pet is registered, detection results and images are securely stored in the pet’s health history. Users can also download a generated health report containing the detection outcome and care recommendations.

Model: DINOv2 + Vision Transformer (ViT)
Deployment: [https://huggingface.co/spaces/Niwazzz/severity-based-detection-api]



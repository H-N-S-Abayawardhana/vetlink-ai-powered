📌 Overview of the Project

This project is an AI-powered pet healthcare system designed to assist pet owners in identifying dog skin diseases and receiving basic care guidance through an intelligent, user-friendly platform. The system integrates computer vision models for disease detection, LLM-based knowledge generation for explanations and care tips, and cloud services for data storage and report management.

📂 **GitHub Repository:** [https://github.com/H-N-S-Abayawardhana/vetlink-ai-powered]
🚀 **Live Demo / Deployment:** [https://vet-link.vercel.app/]

🏗️ System Architecture

The overall system follows a modular, service-oriented architecture, separating the user interface, AI/ML services, LLM integration, and storage components to ensure scalability and maintainability.

Architecture Diagram:
🔗 Draw.io System Architecture – [https://drive.google.com/file/d/1qwxUK4363bIKMenpspJjJ22fCEM8bsJa/view?usp=sharing]

⚙️ Project Dependencies

- Frontend: Web / Mobile UI (Image upload, result visualization, report download)
- ML Models: 
            - DINOv2 + Vision Transformer (ViT) (Skin disease detection and severity classify)
            - XGboost multi label classification
            
- Backend Services: API layer for detection, history management, and reporting
- Storage: Amazon S3 (images and videos)
- Database: Pet health records and detection history
- LLM Integration: For explanations and care guidance

🐶 Dog Skin Disease Detection & Care Guidance Component

This component enables pet owners to detect dog skin diseases by uploading an affected skin image through the user interface. The system uses a DINOv2 + Vision Transformer (ViT)–based machine learning model to identify the type of skin disease and classify its severity level (mild or severe).

Once the detection is completed, the results are displayed in the UI, and an LLM-powered guidance module generates human-readable explanations, including disease information, severity meaning, and basic pet care tips. If the pet is registered, detection results and images are securely stored in the pet’s health history. Users can also download a generated health report containing the detection outcome and care recommendations.

Model: DINOv2 + Vision Transformer (ViT)
Deployment: [https://huggingface.co/spaces/Niwazzz/severity-based-detection-api]




🐾 Pet Health Assessment Component  (B.L.M.Karunarathna - IT22900272)

The Pet Health Assessment Component focuses on maintaining overall canine health by managing pet profiles, assessing body condition, predicting disease risks, and generating personalized diet plans. This component enables data-driven and preventive pet healthcare through intelligent analysis and personalized recommendations.

1. Pet Registration (Add New Dog)

This step allows users to create a detailed dog profile, ensuring that all health assessments are personalized and accurate. The user provides essential pet-related information, including:

- Pet profile information
- Dates and reproductive status
- Identification details
- Diet and living environment
- Health and emergency information

Once all required details are submitted, the pet profile is securely stored in the system and becomes available for future health assessments.

2. Body Condition Score (BCS) Prediction

After registering a pet, users can assess the pet’s Body Condition Score (BCS). The system validates stored pet data such as age, weight, activity level, and physical indicators. A trained machine learning model then predicts the BCS and classifies the pet as:

- Underweight
- Ideal
- Overweight
- Obese

This assessment helps identify potential health risks related to the pet’s physical condition.

3. BCS-Based Disease Risk Prediction

Based on the predicted BCS, the system evaluates potential disease risks by incorporating additional user-provided health information, including:

- Clinical signs
- Preventive care details

The system predicts the probability (%) of the following conditions:

- Tick-borne diseases
- Filariasis (heartworm disease)
- Type 2 diabetes
- Obesity-related metabolic disorders
- Urolithiasis
- Overall health status

Each condition is presented as a risk percentage, supporting early detection and preventive care planning.

4. Personalized Diet Plan Generation

Using the predicted BCS, disease risk analysis, and pet-specific information, the system generates a customized diet plan by considering:

- Body Condition Score (BCS)
- Identified disease risks
- Pet’s age, weight, and activity level
- Allergies and preferred diet type

The generated diet plan aims to:

- Improve or maintain a healthy BCS
- Minimize identified disease risks
- Support long-term pet health and well-being

Model: XGboost multi label classification
Deployment: [https://huggingface.co/spaces/Maleesha29/DiseaseRiskPrediction]
# VetLink – AI-Powered Pet Healthcare System

## Project Overview

VetLink is an AI-powered pet healthcare platform designed to support pet owners with early detection of dog skin diseases, severity classification, and intelligent health assessments, combined with an LLM-powered explanation module. The system aims to bridge the gap between pet owners and preliminary veterinary insights by offering accurate AI-driven detection, easy-to-understand explanations, and personalized care recommendations through a modern, highly mobile-friendly, and user-centric web application. This ensures seamless usability across smartphones, tablets, and desktops, making pet healthcare support accessible anytime, anywhere.

The platform integrates computer vision models, machine learning–based health risk analysis, LLM-driven guidance, and cloud-native services to provide a scalable, maintainable, and real-world–ready solution for preventive pet healthcare.

 **GitHub Repository:** [https://github.com/H-N-S-Abayawardhana/vetlink-ai-powered]

 **Live Demo / Deployment:** [https://vet-link.vercel.app/]


## System Architecture

The system follows a modular, service-oriented architecture, separating responsibilities across the frontend, AI/ML services, LLM guidance layer, and cloud storage. This design ensures scalability, maintainability, and ease of future extension into multimodal and advanced veterinary use cases.

**High-level Architecture Components:**

* Frontend (Next.js App Router)
* AI/ML Inference Services
* LLM Guidance Module
* Backend API Layer
* Cloud Storage & Database Services

**Architecture Diagram:**
* Draw.io Link - [https://drive.google.com/file/d/1qwxUK4363bIKMenpspJjJ22fCEM8bsJa/view?usp=sharing]
* Image Link (from S3 Bucket) - [https://vetlink-main.s3.eu-north-1.amazonaws.com/Architecture-Diagram/VetLink-Architecture_Diagram.drawio.png]


## Technology Stack & Dependencies

### Frontend

* **Next.js (App Router)** – Modern React framework for scalable web applications
* **TypeScript** – Type-safe development
* **Tailwind CSS** – Responsive and consistent UI styling
* **ESLint** – Static code analysis and linting
* **Prettier** – Code formatting and style consistency
* **Husky** – Git hooks to prevent direct pushes to the `main` branch and enforce code quality

### AI / Machine Learning

* **DINOv2 + Vision Transformer (ViT)** – Dog skin disease detection and severity classification
* **XGBoost (Multi-label Classification)** – Disease risk prediction based on Body Condition Score (BCS)
* **YOLO11** - Detect dog's keypoints
* **Random Forest** - Limping Detection


### Backend & Cloud Services

* **Neon Tech Cloud (PostgreSQL)** – Pet profiles, health records, and detection history
* **Amazon S3** – Secure storage for uploaded images and videos
* **API Layer** – Detection, history management, reporting, and health assessment services

### Deployment & DevOps

* **Vercel** – Frontend deployment
* **Hugging Face Spaces** – ML model hosting and inference APIs
* **Git & GitHub** – Version control and collaboration

### Payments & Integrations

* **PayHere Payment Gateway** – Secure payment processing for subscriptions, appointment payments and inventory purchases.



## Dog Skin Disease Detection & Severity Classification with Explainable AI (H.N.S.Abayawardhana - IT22307330)

This component enables early detection and severity assessment of dog skin diseases using a DINOv2 + Vision Transformer (ViT)–based deep learning model, combined with an LLM-powered guidance care module to deliver clear, user-friendly explanations and basic care recommendations for pet owners.

### Workflow

1. A pet owner uploads or capture an image of an affected dog skin area via the web or mobile interface.

2. The system processes the image using a DINOv2 + Vision Transformer (ViT)–based model.

3. The model:

   * Detects the type of dog skin disease.
   * Classifies the severity stage as mild or severe.

4. If the pet is registered, the detection result and image are securely stored in the pet’s health record history (Skin Image save into AWS S3 BUCKET and scan details save into database).

5. After show the detected results, The user interface displays result cards such as:

   * What is this disease?
   * What does mild / severe mean? (based on detected severity)
   * Basic care tips

6. When a user clicks on a card, the LLM-Powered Guidance Care Module dynamically generates easy-to-understand, human-readable content.

### Guidance Care Module

The Guidance Care Module ensures that predictions are not presented as black-box results. Instead, users receive:

* Clear description about the detected disease.
* Meaning of the mild or severity stage (based on detection results).
* Practical, non-clinical care guidance.

This approach improves user trust, interpretability, and decision support, especially for non-technical pet owners.

### Technologies Used

* **Machine Learning:** (Image Classification): Used to analyze dog skin images and detect disease types and severity levels.

* **Python & TensorFlow / PyTorch:** For training, fine-tuning, and evaluating the skin disease detection model.

* **Computer Vision (OpenCV):** Used for image preprocessing such as resizing, normalization, and quality enhancement.

* **Hugging Face (Model Hosting):** Trained models are stored and versioned for easy access and integration.


**Model:** DINOv2 + Vision Transformer (ViT)
**Deployment:** [https://huggingface.co/spaces/Niwazzz/severity-based-detection-api]


## Future Development & Enhancements (By Next Evaluation)

* **Explainable AI (XAI):**  
  Enhance interpretability by generating clear, reason-based explanations that describe why a specific disease and severity level were predicted, using model outputs and contextual pet information rather than visual heatmaps.

* **Metadata-Enhanced Detection Models:**
  Improve detection accuracy by incorporating additional pet metadata such as age, breed, body condition score (BCS), and medical history alongside image and video inputs, enabling more context-aware and reliable predictions.





## Pet Mobility & Limping Detection Component  (H.I.U.Hettiarachchi - IT22922984)

This component focuses on early detection of mobility issues and limping patterns in dogs using video-based computer vision analysis combined with health data–driven disease risk prediction. It helps pet owners identify potential musculoskeletal or joint-related problems at an early stage and receive actionable veterinary guidance.

### Video-Based Limping Detection

Pet owners can upload a 30–60 second video of their dog walking naturally. The system analyzes the video using pose detection and gait analysis techniques to identify abnormal movement patterns.

The analysis provides:

* Limping detection (Normal / Limping)
* Confidence score for the prediction
* Gait symmetry indices (overall, front legs, back legs)
* Stride length measurements for all four legs
* Front and back leg status interpretation

### Mobility Disease Risk Prediction

To improve prediction accuracy, video analysis results are combined with pet health data collected through a short questionnaire, including:

* Age and weight category
* Pain while walking
* Difficulty standing
* Reduced activity level
* Joint swelling

Based on this multi-factor input, the system predicts:

* Possible mobility-related disease or condition
* Risk level (High / Medium / Low)
* Confidence score
* Symptom severity score (0–4)
* Pain severity score (0–4)
* Overall mobility status (Normal / Impaired)

### Personalized Veterinary Recommendations

An AI-driven recommendation module generates personalized veterinary guidance based on the detected risk level and symptom severity. These recommendations help pet owners understand next steps, monitoring needs, and when professional veterinary consultation may be required.

### History & Tracking

* All analyses can be linked to a registered pet profile
* Video files are securely stored in cloud storage (Amazon S3)
* Mobility analysis results are saved to the pet’s medical history
* Enables long-term tracking of mobility changes over time

### Technologies used 

* **Machine Learning (Clinical Risk Classification):** Used to predict disease risk levels (Low / Medium / High) based on symptoms and clinical inputs.

* **Python & Scikit-learn:** For training, evaluating, and deploying the risk prediction model.

* **Feature Engineering (Clinical Indicators):** Includes symptom scoring, age group encoding, pain severity, and interaction features.

* **FastAPI (API Service):** Used to expose the model as a REST API for real-time risk assessment.

**Limping Detection Model:** Pose detection–based computer vision model
**Disease Risk Model:** Machine learning–based risk prediction model

**Deployments:**
* Limping Detection API: [https://huggingface.co/spaces/ishara1234/dog-limping-detection2]
* Disease Risk Prediction API: [https://huggingface.co/spaces/ishara1234/dog-disease-risk-prediction]


## Future Development & Enhancements (By Next Evaluation)

* **Comparison with previous analyses**
* **Export analysis reports (PDF)**
* **Integration with veterinary appointment scheduling**
* **Historical trend visualization**





## Pharmacy Sales Optimization & Inventory Management Component (G.G.M.U.M.Hemawardana -IT22355614)

This component provides intelligent inventory management and demand forecasting for veterinary pharmacies and pet healthcare providers, ensuring optimal stock levels of medications, supplements, and pet healthcare products through AI-powered sales prediction.

### Workflow

A pharmacy fetch medicine details (inventory level, price, expiry date, location, promotional status) via the web interface.
The system processes the data using an XGBoost Gradient Boosting Regressor combined with engineered temporal and historical sales features.
The model:

* Predicts the future sales demand for the next period
* Calculates days until stockout based on current inventory
* Determines recommended restock quantity for optimal inventory levels


The system generates priority-based restocking alerts:

🔴 CRITICAL – Immediate restock required (< 5 days stock)
🟠 URGENT – Restock within 2-3 days (< 10 days stock)
🟡 HIGH – Plan restock soon (< 15 days stock)
🔵 MEDIUM – Consider promotion for excess/near-expiry items
🟢 LOW – Stock levels optimal

If connected to the pharmacy dashboard, predictions and inventory recommendations are securely stored in the pharmacy's management history.
The user interface displays actionable insights such as:

* Predicted sales for next period
* Days until stockout
* Recommended restock quantity
* Priority level and specific action required

### Intelligent Inventory Optimization

The Inventory Optimization Module ensures that pharmacy owners receive data-driven, actionable recommendations rather than raw predictions. Users benefit from:

* Sales demand forecasts based on 32 engineered features including temporal patterns, historical trends, and business factors
* Proactive stockout prevention through early warning alerts
* Expiry management guidance to minimize waste from expired medications
* Optimal reorder quantity calculations to balance stock availability and carrying costs

This approach improves inventory efficiency, cost management, and service reliability, ensuring that critical pet medications are always available when needed.

### Technologies used

* **Machine Learning (Time-Series Regression):** Used to forecast pharmacy medicine demand based on historical sales data.

* **Python & XGBoost:** For training and evaluating the sales prediction model.

* **Data Processing (Pandas & NumPy):** Used for data cleaning, statistical analysis, and temporal feature generation.

* **Gradio (Model Interface):** Provides an interactive interface for demand prediction and inventory insights.


**Model:** XGBoost (Gradient Boosting Regressor) with Random Forest comparison
**Deployment:** [https://huggingface.co/spaces/malindaz/sales_demand]


## Future Development & Enhancements (By Next Evaluation)

* **Advanced NLP Prescription Processing for customers:**
Enhance the prescription reading module with handwriting recognition, multi-language support, and automatic dosage calculation to handle diverse prescription formats and reduce processing errors.

* **Smart Prescription-to-Pharmacy Matching:**
Develop an intelligent matching algorithm that considers not only location but also pricing, stock availability, pharmacy ratings, and estimated wait times to recommend the best pharmacy option.





## Pet Health Assessment Component (B.L.M.Karunarathna – IT22900272)

The Pet Health Assessment component focuses on overall canine health monitoring and preventive care by analyzing pet-specific data and generating personalized recommendations.

### 01. Pet Registration

Users can create a detailed dog profile by providing:

* Basic pet profile information
* Age, gender, reproductive status
* Identification details
* Diet and living environment
* Health history and emergency information

Once registered, the pet profile becomes available for all future health assessments and history tracking.

### 02. Body Condition Score (BCS) Prediction

Using stored pet data such as:

* Age
* Weight
* Activity level
* Physical indicators

A trained ML model predicts the pet’s Body Condition Score (BCS) and classifies it as:

* Underweight
* Ideal
* Overweight
* Obese

This step helps identify early signs of nutrition- or lifestyle-related health risks.

### 03. BCS-Based Disease Risk Prediction

Based on the predicted BCS and additional health inputs (clinical signs and preventive care data), the system predicts the risk probability (%) of:

* Tick-borne diseases
* Filariasis (heartworm disease)
* Type 2 diabetes
* Obesity-related metabolic disorders
* Urolithiasis
* Overall health risk status

This supports early intervention and preventive planning.

### 04. Personalized Diet Plan Generation

Using:

* BCS results
* Disease risk predictions
* Pet’s age, weight, and activity level
* Allergies and diet preferences

The system generates a customized diet plan aimed at:

* Achieving or maintaining an ideal BCS
* Reducing identified disease risks
* Supporting long-term pet health and well-being

### Technologies used

* **Machine Learning** (Bcs related disease risk prediction): Used to assess risk for multiple diseases simultaneously using clinical data.

* **Python & XGBoost:** For training and inference of disease-specific risk models.

* **Feature Engineering (BCS Indicators):** Incorporates Body Condition Score (BCS), age interactions, and obesity-related risk factors.

* **Gradio (Clinical Screening UI):** Used to collect inputs and display multi-disease risk outputs.

**Model:** XGBoost (Bcs related disease risk prediction)
**Deployment:** [https://huggingface.co/spaces/Maleesha29/DiseaseRiskPrediction]


## Future Development & Enhancements (By Next Evaluation)

* **Machine Learning–Based Body Condition Score (BCS) Prediction:**
A dedicated machine learning model will be developed to automatically predict the Body Condition Score (BCS) of pets using physical,  and health-related parameters. This model will enable objective health assessment and support early identification of underweight, overweight, and obesity conditions that may lead to potential health risks.

* **AI-Powered Diet Recommendation System with Disease Risk Awareness:**
An intelligent, AI-driven diet recommendation system will be implemented to generate personalized nutrition plans for pets. The system will utilize the predicted BCS along with BCS-related disease risk indicators, such as obesity-related or malnutrition-related conditions, in addition to pet-specific attributes including age, breed, weight, activity level, and medical history. By considering these risk factors, the system aims to provide targeted dietary recommendations that help mitigate disease risks, improve health outcomes, and promote long-term pet well-being.

# Reveal - Setup

## 📦 Data Setup

1. **Preprocess Your Dataset**

   Go to the [Reveal Preprocessing Repository](https://github.com/leovsferreira/reveal-preprocessing)  
   and follow the steps there to preprocess your dataset.

2. **Organize the Backend Dataset Structure**

   After completing preprocessing, navigate to your Reveal backend folder and create the following structure:

```bash
/back/
├── dataset/
│   ├── llm/
│   │   ├── processed/
│   │   │   ├── 0.jpg
│   │   │   ├── 1.jpg
│   │   │   └── ...
│   │   └── thumbnails/
│   │       ├── 0.jpg
│   │       ├── 1.jpg
│   │       └── ...
│   └── files/
│       ├── unique_words_final.json
│       ├── data_final.json
│       ├── multi_clip_images_embedding.pt
│       ├── multi_clip_words_embedding.pt
│       └── multi_clip_joint_embedding.pt
```


✅ **Make sure**:
- All `.jpg` files are named using their numeric IDs (`0.jpg`, `1.jpg`, etc.).
- The JSON and `.pt` files come directly from the Reveal Preprocessing output.

---

## ⚙️ Installation

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** (v22.13.0 recommended)
- **npm** (comes with Node)
- **Angular CLI** (v14.1.0)
- **Python** (3.9+)
- **conda** (recommended for managing the backend environment)

---

### 2. Frontend Setup

```bash
# Navigate to the frontend folder
cd front

# Install dependencies
npm install

# Run the frontend
ng serve
```

Once it compiles successfully, open your browser and visit:
👉 http://localhost:4200

### 3. Backend Setup

```bash
# Open a new terminal
cd back

# Create and activate a conda environment
conda create -n reveal python=3.9 -y
conda activate reveal

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python app.py
```

The backend will start running.

## 🧠 Troubleshooting

### Angular not recognized?
Install it globally:

```bash
npm install -g @angular/cli@14.1.0
```

### Missing Node version?
Install Node using nvm:

```bash
nvm install 22.13.0
nvm use 22.13.0
```

### Backend cannot find dataset files?
Double-check that your directory structure exactly matches the layout shown above and that filenames are consistent with the preprocessing output.
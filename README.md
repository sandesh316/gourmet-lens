
# 🍳 Gourmet Lens

A Neo-Brutalist menu scanner that uses Google Gemini to visualize unfamiliar international dishes.

## Deployment

### 1. Environment Variables
You MUST set the following environment variable in your hosting provider (Vercel, Netlify, etc.):
- `API_KEY`: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### 2. Manual Setup
If you want to run this locally:
1. `npm install`
2. `export API_KEY=your_key_here`
3. `npm run dev`

### 3. Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

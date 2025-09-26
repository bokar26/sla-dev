# Reverse Image Search Feature

## Overview

The Reverse Image Search feature allows users to upload 1-5 images and use AI-powered analysis to find matching factories. The system uses Mistral's Pixtral vision model to extract product attributes and match them against our factory database.

## Features

### Frontend Components

- **ImageSearchPanel**: Drag-and-drop interface for uploading images
- **ImageSearchProgress**: Animated progress indicator during analysis
- **ImageSearchInfoModal**: Information modal explaining how the feature works
- **Tabs**: Switch between Text Search and Image Search modes

### Backend API

- **POST /api/search/reverse-image**: Main endpoint for reverse image search
- **Mock Mistral Integration**: Currently uses mock data for development
- **Factory Matching**: Hybrid ranking system based on extracted attributes

## Technical Implementation

### Image Analysis Pipeline

1. **File Upload**: Accepts PNG, JPG, WebP, HEIC files (max 12MB each, 5 files max)
2. **Temporary Storage**: Files stored in temp directory with 24h auto-cleanup
3. **AI Analysis**: Each image analyzed with Mistral Pixtral for:
   - Product category
   - Materials and blend ratios
   - Construction details
   - Manufacturing processes
   - Regional hints
4. **Attribute Merging**: Multiple images merged using majority vote and union operations
5. **Factory Matching**: Hybrid scoring based on:
   - Category matching (30%)
   - Material matching (20%)
   - Capability matching (10% per feature)
   - Region boost (10%)

### Security & Privacy

- **EXIF Stripping**: Metadata removed for privacy
- **Temporary Storage**: Files auto-deleted after 24 hours
- **No Human Review**: Only AI systems process images
- **Rate Limiting**: 20 images/user/day (planned)

### Mock Data Structure

```json
{
  "product_category": "hoodie",
  "primary_materials": ["cotton", "polyester"],
  "blend_ratio_guess": {"cotton": 80, "polyester": 20},
  "fabric_characteristics": ["fleece", "loop-knit"],
  "key_features": ["kangaroo pocket", "drawcord hood", "raglan sleeves"],
  "construction_notes": ["overlock seams", "coverstitch hems"],
  "finishing": ["enzyme wash"],
  "accessories_trims": ["elastic waistband"],
  "printing_techniques": ["screenprint"],
  "estimated_moq_band": "mid(200-1000)",
  "region_hints": ["tiruppur", "guangdong"],
  "style_tags": ["streetwear", "athletic"],
  "brand_ip_risk": "none",
  "confidence": 0.85
}
```

## Usage

1. Navigate to SLA Search page
2. Click "Image Search (Beta)" tab
3. Drag and drop images or click to browse
4. Optionally add hints about requirements
5. Click "Analyze & Find Factories"
6. View results with extracted attributes

## Development Notes

- Currently uses mock Mistral API responses
- Real Mistral integration requires API key configuration
- Factory matching uses existing CSV data
- Progress simulation for better UX
- Error handling for file validation and API failures

## Future Enhancements

- Real Mistral Pixtral API integration
- Advanced attribute merging algorithms
- Vector similarity search for better matching
- Export functionality for image search results
- Batch processing for multiple searches
- Caching for repeated image analysis

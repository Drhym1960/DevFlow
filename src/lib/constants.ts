export const CATEGORIES = [
  "Fashion & Beauty",
  "Business & Corporate",
  "Technology",
  "Apps & Software",
  "Lifestyle",
  "Healthcare & Wellness",
  "Real Estate",
  "Restaurants & Hospitality",
  "Ecommerce",
  "Luxury",
  "General Marketing",
] as const;

export const GOALS = [
  { id: "product-ad", label: "Product advertisement" },
  { id: "app-promo", label: "App promotion" },
  { id: "fashion", label: "Fashion campaign" },
  { id: "intro", label: "Business introduction" },
  { id: "social", label: "Social media advertisement" },
  { id: "launch", label: "Product launch" },
  { id: "explainer", label: "Explainer" },
  { id: "awareness", label: "Brand awareness" },
  { id: "offer", label: "Promotional offer" },
  { id: "website", label: "Website promotion" },
] as const;

export const FORMATS = [
  { id: "vertical", label: "Vertical 9:16", hint: "TikTok, Reels, Shorts", width: 1080, height: 1920 },
  { id: "landscape", label: "Landscape 16:9", hint: "YouTube, websites, TV", width: 1920, height: 1080 },
  { id: "square", label: "Square 1:1", hint: "Feed ads, ecommerce", width: 1080, height: 1080 },
] as const;

export const TONES = [
  "Professional",
  "Friendly",
  "Luxury",
  "Energetic",
  "Calm",
  "Warm",
  "Confident",
  "Sales-focused",
  "Conversational",
] as const;

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "ar", label: "Arabic" },
  { id: "ko", label: "Korean" },
  { id: "ja", label: "Japanese" },
  { id: "pt", label: "Portuguese" },
  { id: "ha", label: "Hausa" },
  { id: "yo", label: "Yoruba" },
  { id: "ig", label: "Igbo" },
  { id: "hi", label: "Hindi" },
] as const;

export const ACCENTS = [
  "Neutral",
  "American",
  "British",
  "Nigerian",
  "Ghanaian",
  "Arabic",
  "Korean",
  "Japanese",
  "German",
  "French",
  "Spanish",
  "West African",
] as const;

export const MUSIC_BEDS = [
  { id: "cinematic-warm", label: "Cinematic warm" },
  { id: "luxury-pulse", label: "Luxury pulse" },
  { id: "upbeat-social", label: "Upbeat social" },
  { id: "calm-editorial", label: "Calm editorial" },
  { id: "tech-minimal", label: "Tech minimal" },
] as const;

export const STUDIO_STYLES = [
  "Premium dark studio",
  "Soft daylight loft",
  "Luxury marble lounge",
  "Clean product cyclorama",
  "Warm lifestyle kitchen",
  "Modern glass office",
  "Editorial fashion set",
  "Wellness spa light",
  "Evening city terrace",
] as const;

export const PIPELINE_STAGES = [
  { id: "analyzing", label: "Analyzing Brand" },
  { id: "writing", label: "Writing Script" },
  { id: "voice", label: "Creating Voice" },
  { id: "presenter", label: "Generating Presenter" },
  { id: "scenes", label: "Building Scenes" },
  { id: "branding", label: "Adding Branding" },
  { id: "rendering", label: "Rendering Video" },
] as const;

export const ASSET_KINDS = [
  { id: "logo", label: "Logo" },
  { id: "product", label: "Product photo" },
  { id: "screenshot", label: "App / website screenshot" },
  { id: "video", label: "Existing video" },
  { id: "graphic", label: "Promotional graphic" },
  { id: "store-sample", label: "Store screenshot sample" },
  { id: "store-screen", label: "App screenshot" },
] as const;

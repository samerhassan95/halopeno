export interface DigitalFile { id: string; name: string; type: string; size: string; version: string; url: string; storage: string; downloadLimit: number | null; expirationDays: number | null; visibility: string; }
export interface DigitalVersion { id: string; number: string; releaseDate: string; changelog: string; supportedOs: string; browsers: string; compatibility: string; latest: boolean; }
export interface DigitalVariant { id: string; name: string; price: number; license: string; features: string; file: string; activationLimit: number; }
export interface DigitalLicenseKey { id: string; key: string; customer: string; product: string; version: string; status: string; activationCount: number; expiration: string; devices: string; domains: string; }

export interface DigitalConfig {
  productType: string; version: string; collection: string; tags: string; thumbnail: string; gallery: string; previewImages: string; demoVideo: string;
  subscriptionPrice: number; lifetimePrice: number; taxClass: string; currency: string;
  files: DigitalFile[]; versions: DigitalVersion[];
  licenseType: string; licenseKeyRequired: boolean; autoGenerateLicense: boolean; activationLimit: number; deviceLimit: number; domainLimit: number; licenseExpirationDays: number | null; renewalAvailable: boolean;
  downloadLimit: number | null; downloadExpirationDays: number | null; instantDownload: boolean; manualApproval: boolean; secureDownload: boolean; watermarkFiles: boolean; fileEncryption: boolean;
  liveDemoUrl: string; documentationUrl: string; githubUrl: string; videoTutorial: string; screenshots: string;
  dependencies: Record<string, string>; variants: DigitalVariant[];
  billingCycle: string; autoRenew: boolean; trialDays: number; gracePeriodDays: number; cancellationPolicy: string;
  userGuide: string; installationGuide: string; apiDocumentation: string; faq: string; releaseNotes: string; troubleshooting: string;
  canonicalUrl: string; openGraphImage: string; mediaFiles: string;
  featured: boolean; bestSeller: boolean; newRelease: boolean; downloads: number; sales: number; rating: number; licenseKeys: DigitalLicenseKey[];
}

export interface DigitalProductRow {
  id: string; name: string; slug: string; sku: string; status: string; type: string; categoryId: string | null; category?: { id: string; name: string } | null;
  brandId: string | null; brand?: { id: string; name: string } | null; regularPrice: string; salePrice: string | null; stock: number; rating: string; reviewCount: number;
  createdAt: string; updatedAt: string; images?: { url: string }[]; digitalConfig?: Partial<DigitalConfig> | null;
}

export const defaultDigitalConfig: DigitalConfig = {
  productType: "Software", version: "1.0.0", collection: "", tags: "", thumbnail: "", gallery: "", previewImages: "", demoVideo: "",
  subscriptionPrice: 0, lifetimePrice: 0, taxClass: "Digital goods", currency: "USD", files: [], versions: [], licenseType: "Commercial",
  licenseKeyRequired: true, autoGenerateLicense: true, activationLimit: 1, deviceLimit: 1, domainLimit: 1, licenseExpirationDays: null, renewalAvailable: true,
  downloadLimit: 5, downloadExpirationDays: 30, instantDownload: true, manualApproval: false, secureDownload: true, watermarkFiles: false, fileEncryption: false,
  liveDemoUrl: "", documentationUrl: "", githubUrl: "", videoTutorial: "", screenshots: "",
  dependencies: { php: "", node: "", laravel: "", wordpress: "", flutter: "", react: "", vue: "", plugins: "", extensions: "" }, variants: [],
  billingCycle: "Lifetime", autoRenew: false, trialDays: 0, gracePeriodDays: 7, cancellationPolicy: "Cancel anytime before the next billing date.",
  userGuide: "", installationGuide: "", apiDocumentation: "", faq: "", releaseNotes: "", troubleshooting: "", canonicalUrl: "", openGraphImage: "", mediaFiles: "",
  featured: false, bestSeller: false, newRelease: true, downloads: 0, sales: 0, rating: 0, licenseKeys: [],
};

export const DIGITAL_PRODUCT_TYPES = ["Software", "SaaS", "Source Code", "Mobile App", "Website Template", "UI Kit", "Theme", "Plugin", "Script", "API", "eBook", "PDF", "Course", "Music", "Video", "Graphic Assets", "Icons", "Fonts", "3D Models", "Digital Bundle", "Other"];
export const DIGITAL_FILE_TYPES = ["ZIP", "PDF", "MP4", "MP3", "APK", "EXE", "DMG", "ISO", "PSD", "AI", "FIG", "DOCX", "PPTX", "XLSX", "JSON", "Other"];

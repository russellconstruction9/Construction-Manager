/**
 * Environment configuration utility
 * Centralizes all environment variable access and provides type safety
 */

interface EnvironmentConfig {
  geminiApiKey: string;
  googleMapsApiKey: string;
  apiBaseUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
    };

    // Only validate in development - production can work without backend initially
    if (this.config.isDevelopment) {
      this.validate();
    }
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private validate(): void {
    const missingVars: string[] = [];

    // Only warn about missing API keys, don't make them required
    if (!this.config.geminiApiKey) {
      missingVars.push('VITE_GEMINI_API_KEY');
    }

    if (!this.config.googleMapsApiKey) {
      missingVars.push('VITE_GOOGLE_MAPS_API_KEY');
    }

    if (missingVars.length > 0) {
      console.warn(
        `⚠️  Optional environment variables not configured: ${missingVars.join(', ')}\n` +
        'Some features may be limited. Check .env.example for full configuration.'
      );
    }
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public get geminiApiKey(): string {
    return this.config.geminiApiKey;
  }

  public get googleMapsApiKey(): string {
    return this.config.googleMapsApiKey;
  }

  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public get isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  public get isProduction(): boolean {
    return this.config.isProduction;
  }

  // Method to check if API keys are configured
  public areApiKeysConfigured(): boolean {
    return !!(this.config.geminiApiKey && this.config.googleMapsApiKey);
  }
}

export const env = Environment.getInstance();
export default env;
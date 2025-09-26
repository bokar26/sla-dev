// Configuration service for feature flags and app settings

export interface AppConfig {
  featureAlibaba: boolean;
  alibabaEnabled: boolean;
}

export async function getConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('http://localhost:8000/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching config:', error);
    // Return default config if fetch fails
    return {
      featureAlibaba: false,
      alibabaEnabled: false,
    };
  }
}

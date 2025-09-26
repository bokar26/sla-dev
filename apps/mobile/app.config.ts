import { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  name: 'SLA Mobile',
  slug: 'sla-mobile',
  scheme: 'slamobile',
  ios: { supportsTablet: true, bundleIdentifier: 'com.yourcompany.slamobile' },
  android: { package: 'com.yourcompany.slamobile' },
  extra: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'https://api.example.com'
  }
});

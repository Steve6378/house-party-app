/**
 * Native platform utilities for Capacitor
 * Provides wrappers around native APIs with web fallbacks
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

// Check if running on native platform (Android/iOS)
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web', 'android', 'ios'

/**
 * Take a photo using device camera or pick from gallery
 */
export const takePicture = async (source: 'camera' | 'gallery' = 'camera') => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos
    });
    return image.webPath || null;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
};

/**
 * Pick photo from gallery
 */
export const pickPhoto = async () => {
  return takePicture('gallery');
};

/**
 * Get current GPS position
 */
export const getCurrentPosition = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
};

/**
 * Request location permissions
 */
export const requestLocationPermission = async () => {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === 'granted';
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

/**
 * Share content using native share sheet
 */
export const shareContent = async (data: {
  title?: string;
  text?: string;
  url?: string;
}) => {
  try {
    await Share.share({
      title: data.title,
      text: data.text,
      url: data.url,
      dialogTitle: 'Share'
    });
    return true;
  } catch (error) {
    console.error('Share error:', error);
    return false;
  }
};

/**
 * Share an event
 */
export const shareEvent = async (event: { name: string; id: string }) => {
  const url = `${window.location.origin}/events/${event.id}`;
  return shareContent({
    title: event.name,
    text: `Check out this event: ${event.name}`,
    url
  });
};

/**
 * Trigger haptic feedback
 */
export const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isNative) return;
  try {
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    }[style];
    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    // Haptics not available
  }
};

/**
 * Set status bar style (dark/light)
 */
export const setStatusBarStyle = async (style: 'dark' | 'light') => {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({
      style: style === 'dark' ? Style.Dark : Style.Light
    });
  } catch (error) {
    // Status bar not available
  }
};

/**
 * Hide keyboard
 */
export const hideKeyboard = async () => {
  if (!isNative) return;
  try {
    await Keyboard.hide();
  } catch (error) {
    // Keyboard not available
  }
};

/**
 * Check network status
 */
export const getNetworkStatus = async () => {
  try {
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType
    };
  } catch (error) {
    return { connected: true, connectionType: 'unknown' };
  }
};

/**
 * Listen for network changes
 */
export const onNetworkChange = (callback: (connected: boolean) => void) => {
  return Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
};

/**
 * Store data locally (persists across app restarts)
 */
export const setLocalData = async (key: string, value: string) => {
  await Preferences.set({ key, value });
};

/**
 * Get locally stored data
 */
export const getLocalData = async (key: string) => {
  const result = await Preferences.get({ key });
  return result.value;
};

/**
 * Remove locally stored data
 */
export const removeLocalData = async (key: string) => {
  await Preferences.remove({ key });
};

/**
 * Listen for app state changes (foreground/background)
 */
export const onAppStateChange = (callback: (isActive: boolean) => void) => {
  return App.addListener('appStateChange', (state) => {
    callback(state.isActive);
  });
};

/**
 * Handle back button (Android)
 */
export const onBackButton = (callback: () => void) => {
  return App.addListener('backButton', callback);
};

/**
 * Initialize native features on app start
 */
export const initNative = async () => {
  if (!isNative) return;

  // Set dark status bar for dark theme
  await setStatusBarStyle('dark');

  // Log platform
  console.log(`Running on ${platform}`);
};

export default {
  isNative,
  platform,
  takePicture,
  pickPhoto,
  getCurrentPosition,
  requestLocationPermission,
  shareContent,
  shareEvent,
  hapticFeedback,
  setStatusBarStyle,
  hideKeyboard,
  getNetworkStatus,
  onNetworkChange,
  setLocalData,
  getLocalData,
  removeLocalData,
  onAppStateChange,
  onBackButton,
  initNative
};

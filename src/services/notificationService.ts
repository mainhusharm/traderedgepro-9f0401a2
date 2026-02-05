// Notification Service
// Handles in-app and push notifications with sounds

import { toast } from 'sonner';

export type NotificationType = 
  | 'signal' 
  | 'trade' 
  | 'news' 
  | 'alert' 
  | 'achievement' 
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  days: number[];    // 0-6, where 0 is Sunday
}

// Default sound URLs for different notification types
const DEFAULT_SOUND_URLS: Record<string, string> = {
  achievement: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhO28AAP//AQAFAAEA/f8HAAgA+/8EAAUA/f8FAA4ACgAAAP7/BQAKAA8ACgAEAAIABwAHAAcACAANABEAFAAQAAsABwALAA4AEQATABMADwAMAAsADAANAA4ADwAOAA0ACwAKAAkACgAKAAsACwALAAoACgAJAAkACQAJAAkACAAIAAgACAAHAAcABwAGAAYABgAGAAYABQAFAAUABQAFAAQABAAEAAQABAADAAMAAwADAAMAAgACAAIAAgACAAEAAQABAAEAAQAAAAAAAAAAAAAA//8AAAAAAQABAAEAAAD//wAAAAAAAAAAAAD/////AAAAAAEAAQABAAAA//8AAAAA',
  signal: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQtAl9/JnadfHEqZ2LmEZ0cjVJ3hwYFmSxpdpeHCdVpQHmak4ryEYVMhZ6nkvohiURVnsOW+imJPE2245b6QY0sTabnkvJdmRwtgvuK3lmlHB2G+4bKWaEgHYb7esppnRQ5ewN6ynGVDB2C/3K2aY0QMXsDbspxiRAhfv9q0m2JHCF/A2rWaYEgGYL/btJlgRgZfv9uymV9GB2C/3LGZXkcJYMDcsZhfRgdgwNyxl19GCF+/3LGYXkYIYL/cspdcRQhgwNyvl11FCGDA262XXEQJYcLbqpVaQwpiwt2ql1lCCmHC3amWV0ILYsLdqZVYQQtiwd2olFdBCmHC3aeUVkEKYsHepZRVPwtiwt+klFU/C2HB3qOTVD4MYsLfo5NTPQxhwt+hkFM8DGPC36CQUjwNY8PgoI9ROg5jw+CfjlE6DmPD4J6OUDkOZMThn41QOQ9kxOGejE44D2TE4p2LTjgQZMTinItNNxBkxOKbi003EWXF45uKTDYRZcXjmoZMNRJlxeOZhko1EmXF45mFSDMTZsbjmIVIMhNnxuOYhEcyE2fH5JeCRzEUZ8fkl4FGMRRox+SXgEYwFWjI5JZ/RS8VaMjklX5ELxZpyOSVfkQtFmnI5JR9Qy0XacjklHxCLBdqyOWTfEIsGGnJ5ZN7QSsYasnlknpAKxlqyeWSekAqGWrJ5ZF5PyoaasrlkHg+KhpqyuWQdz4pG2rK5ZB3PCkba8vlj3Y8KBxrze+ReDsqHGvN8JF3OygeaM3xj3U5KB9tzfGPdDgpH27P8o5zNyoga8/yj3I2KSFuz/KOczYpIm7R846CMSkrcdPziXYvLzJz1PSJdi0xNHXY9YhyKjQ3d9z3h24mODl74fiGayI8PHvf+oNlHD1Bftv6g2QaQEd/1veAYRxARH3Q84BdIUJIesvxflwjREd6zfB8WydFSXrP8HtbKUdKedHweVcrSEp50/F4VStJS3nT8XdSLEpKd9Tyd1IuS0x31PF2US5MTHbV8nVRL05Ndtbzc08wT0921vNyTjFQUHbX9HBOMlFQd9nzcUwyUlB22PRvTTRUUnbY9G9MNFRSdtr1bUo0VFJ22vVrSTVVU3bb9WtINlVTeN32akY1VlV43fZqRjZWVXfe92pFN1dWeN/3Z0M3WFd54PhkQThZWHng+GRBOVpZeuH4Y0E5W1p74vhiQDlaW3vi+GJAO1xbe+P5YD88XF184vhePzxdXXzj+V4+PV1efOP4XT8+Xl994/hcPj5eX37k+Fs9Pl9gfuT4Wj0/YGF/5flZPD5gYX/l+Vg8QGFhgOX5VztAYWKA5vlWO0BiY4Hm+VU6QWNjgef5VDpBY2OB5/pTOUJkZIHn+lI5QmRkgej6UTlDZWWC6PpQOENlZoLo+k84RGZnguj6TjdEZmeC6fpNOEVnaIPp+k04RWhog+n6TDZGaGmE6fpLNUZoaYTq+ko1R2lphOr6STVIammE6vpJNEhqaoXq+kg0SWpqhev6RzRKa2uF6/pGNEpra4br+kU0S2xshuz6RDRMY2l27PpDM0xja3bs+kMzTWNtduz6QjNNY2127PpCM01jbnbs+kEzTmRud+36QDNOZG537fk/M09lbnfu+T8zT2Vvd+75PjNQZW937vk+M1Bkb3jv+T0yUGRweO/5PDJRZnB48Pk8MlFmcHnw+TsyUWZxefH4OjJSZ3F58fk5MVJncXrx+TgxU2hyen/z+DcxU2hzevP4NjFUaHN78/g2MVRodHvz+DUxVWhze/T3NDBVaHR89Pg0MFZpdHz0+DMwVml1fPT4MjBWaXV89fc0MFhndnv19zQvWGh2fPX2My5YaHZ99vYyLllpd3729jEuWml3fvf2MC5aanZ+9/UvL1tqd3749C8vW2p3fvj0Li9ca3d++fQtLl1sdn/69CwuXWx2f/n0Ky1dbXd/+vQrLV5td3/69SstXW14f/r0Kixebnh/+/QpLF5ueID79CksX294gPvzKCtfb3mA+/MnK2BveYD88ycrYHB5gfvyJitgcHmB/PIlKmFxeYH98iUpYXF5gf3yJSlicXqC/fEkKWJyeoL+8SQpYnJ7gv7wIyhic3uD/vAjJ2Jze4P+7yInY3R7hP7uICdkdXuE/u0fJmR1e4T/7R8mZXZ8hf/sHiVld3yF/+sdJWV3fIb/6x0kZnd9hv/qHCRmeH2H/+kcI2Z4fYf/6BsiZ3l9iP/oGyJnenyI/+cbImh6fYj/5hoh',
  session: 'data:audio/wav;base64,UklGRmQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhQAUAAP//AQACAAEAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAgABAAAAAAD//wEAAQABAAAAAAD//wEAAQABAAAAAAD//wEAAQABAAAAAAD//wEAAQABAAAAAAD//wAAAQABAAAAAAD//wAAAQABAAAAAAD//wAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAA',
  alert: 'data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhO28AAP7/AgAKAAoABAABAAUACgANAAkABAAEAAkADgANAAcAAwAGAAwADwAKAAQABAAJAA0ADQAHAAMABgALAA4ACgAEAAQACQANAAsABgADAAYACgAMAAgABAAEAAgACwAKAAUAAwAFAAkACgAHAAQABAAHAAkACAAFAAMABQAIAAkABgAEAAQABgAIAAcABQADAAQABwAHAAYABAADAAUABgAGAAQAAwAEAAUABQAEAAMAAwAEAAQABAADAAIAAwAEAAQAAwACAAIAAwADAAMAAgACAAIAAwACAAIAAQACAAIAAgABAAEAAQACAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAAAAAAAAAP//AAAAAP//AAAAAAAAAAD//wAAAAD//wAAAAAAAAAA//8AAAAA//8AAAAA//8AAP//AAAAAP//AAAAAP//AAD//wAAAAD//wAAAAD//wAA//8AAAAA//8AAAAA//8AAP//AAAAAAAA',
  success: 'data:audio/wav;base64,UklGRqQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhgAMAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAP//AAABAAIAAQAAAA=='
};

// Custom sounds storage key prefix
const CUSTOM_SOUND_KEY_PREFIX = 'custom_notification_sound_';
const VOLUME_KEY = 'notification_sound_volume';
const QUIET_HOURS_KEY = 'notification_quiet_hours';

const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: false,
  startTime: '22:00',
  endTime: '07:00',
  days: [0, 1, 2, 3, 4, 5, 6]
};

// Get sound URL (custom or default)
const getSoundUrl = (type: string): string => {
  const customSound = localStorage.getItem(`${CUSTOM_SOUND_KEY_PREFIX}${type}`);
  return customSound || DEFAULT_SOUND_URLS[type] || DEFAULT_SOUND_URLS.session;
};

// Audio player singleton
class NotificationSoundPlayer {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private soundEnabled: boolean = true;
  private volume: number = 0.5;
  private quietHours: QuietHoursConfig = DEFAULT_QUIET_HOURS;

  constructor() {
    this.loadPreferences();
    this.initializeAudio();
  }

  private loadPreferences() {
    const storedEnabled = localStorage.getItem('notification_sounds_enabled');
    this.soundEnabled = storedEnabled !== 'false';
    
    const storedVolume = localStorage.getItem(VOLUME_KEY);
    this.volume = storedVolume ? parseFloat(storedVolume) : 0.5;

    const storedQuietHours = localStorage.getItem(QUIET_HOURS_KEY);
    if (storedQuietHours) {
      try {
        this.quietHours = JSON.parse(storedQuietHours);
      } catch {
        this.quietHours = DEFAULT_QUIET_HOURS;
      }
    }
  }

  private initializeAudio() {
    const soundTypes = ['achievement', 'signal', 'session', 'alert', 'success'];
    soundTypes.forEach((type) => {
      const url = getSoundUrl(type);
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.audioElements.set(type, audio);
    });
  }

  private isInQuietHours(): boolean {
    if (!this.quietHours.enabled) return false;

    const now = new Date();
    const currentDay = now.getDay();
    
    if (!this.quietHours.days.includes(currentDay)) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = this.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.quietHours.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentTime >= startMinutes || currentTime < endMinutes;
    }
    
    return currentTime >= startMinutes && currentTime < endMinutes;
  }

  reloadSound(type: string) {
    const url = getSoundUrl(type);
    const audio = new Audio(url);
    audio.volume = this.volume;
    audio.preload = 'auto';
    this.audioElements.set(type, audio);
  }

  reloadAllSounds() {
    const soundTypes = ['achievement', 'signal', 'session', 'alert', 'success'];
    soundTypes.forEach((type) => this.reloadSound(type));
  }

  play(type: string, forcePlay: boolean = false) {
    // Skip if sounds disabled or in quiet hours (unless forced for preview)
    if (!forcePlay && (!this.soundEnabled || this.isInQuietHours())) return;
    
    const audio = this.audioElements.get(type);
    if (audio) {
      audio.volume = this.volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('notification_sounds_enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.soundEnabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem(VOLUME_KEY, String(this.volume));
    
    // Update all audio elements
    this.audioElements.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  getVolume(): number {
    return this.volume;
  }

  setQuietHours(config: QuietHoursConfig) {
    this.quietHours = config;
    localStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(config));
  }

  getQuietHours(): QuietHoursConfig {
    return { ...this.quietHours };
  }

  setCustomSound(type: string, dataUrl: string) {
    localStorage.setItem(`${CUSTOM_SOUND_KEY_PREFIX}${type}`, dataUrl);
    this.reloadSound(type);
  }

  removeCustomSound(type: string) {
    localStorage.removeItem(`${CUSTOM_SOUND_KEY_PREFIX}${type}`);
    this.reloadSound(type);
  }

  hasCustomSound(type: string): boolean {
    return localStorage.getItem(`${CUSTOM_SOUND_KEY_PREFIX}${type}`) !== null;
  }

  getCustomSoundTypes(): string[] {
    const types: string[] = [];
    const soundTypes = ['achievement', 'signal', 'session', 'alert', 'success'];
    soundTypes.forEach((type) => {
      if (this.hasCustomSound(type)) {
        types.push(type);
      }
    });
    return types;
  }

  // Preview a sound from data URL (for file uploads)
  previewSound(dataUrl: string): HTMLAudioElement {
    const audio = new Audio(dataUrl);
    audio.volume = this.volume;
    return audio;
  }
}

const soundPlayer = new NotificationSoundPlayer();

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Keep only last 100 notifications
      const toSave = this.notifications.slice(0, 100);
      localStorage.setItem('notifications', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.notifications);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  add(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();

    // Play sound based on notification type
    this.playSound(newNotification.type);

    // Show toast for immediate feedback
    this.showToast(newNotification);
  }

  private playSound(type: NotificationType): void {
    switch (type) {
      case 'achievement':
        soundPlayer.play('achievement');
        break;
      case 'signal':
        soundPlayer.play('signal');
        break;
      case 'alert':
        soundPlayer.play('alert');
        break;
      case 'trade':
        soundPlayer.play('success');
        break;
      default:
        soundPlayer.play('session');
    }
  }

  private showToast(notification: Notification): void {
    const toastOptions: Parameters<typeof toast>[1] = {
      description: notification.message,
      duration: 5000,
    };

    switch (notification.type) {
      case 'signal':
        toast.info(notification.title, toastOptions);
        break;
      case 'trade':
        toast.success(notification.title, toastOptions);
        break;
      case 'alert':
        toast.warning(notification.title, toastOptions);
        break;
      case 'achievement':
        toast.success(notification.title, { 
          ...toastOptions, 
          icon: '🏆',
          duration: 8000,
        });
        break;
      case 'news':
        toast.info(notification.title, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }
  }

  // Sound control methods
  setSoundEnabled(enabled: boolean): void {
    soundPlayer.setEnabled(enabled);
  }

  isSoundEnabled(): boolean {
    return soundPlayer.isEnabled();
  }

  setVolume(volume: number): void {
    soundPlayer.setVolume(volume);
  }

  getVolume(): number {
    return soundPlayer.getVolume();
  }

  setQuietHours(config: QuietHoursConfig): void {
    soundPlayer.setQuietHours(config);
  }

  getQuietHours(): QuietHoursConfig {
    return soundPlayer.getQuietHours();
  }

  setCustomSound(type: string, dataUrl: string): void {
    soundPlayer.setCustomSound(type, dataUrl);
  }

  removeCustomSound(type: string): void {
    soundPlayer.removeCustomSound(type);
  }

  hasCustomSound(type: string): boolean {
    return soundPlayer.hasCustomSound(type);
  }

  getCustomSoundTypes(): string[] {
    return soundPlayer.getCustomSoundTypes();
  }

  previewSound(dataUrl: string): HTMLAudioElement {
    return soundPlayer.previewSound(dataUrl);
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  delete(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getByType(type: NotificationType): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper functions for common notification types
export const notifySignal = (symbol: string, direction: string, confidence: number) => {
  notificationService.add({
    type: 'signal',
    title: `New Signal: ${symbol}`,
    message: `${direction} signal with ${confidence}% confidence`,
    data: { symbol, direction, confidence },
  });
};

export const notifyTrade = (symbol: string, outcome: 'win' | 'loss', pnl: number) => {
  notificationService.add({
    type: 'trade',
    title: outcome === 'win' ? '🎯 Trade Won!' : '❌ Trade Closed',
    message: `${symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
    data: { symbol, outcome, pnl },
  });
};

export const notifyAchievement = (title: string, description: string) => {
  notificationService.add({
    type: 'achievement',
    title: `🏆 ${title}`,
    message: description,
  });
};

export const notifyAlert = (title: string, message: string) => {
  notificationService.add({
    type: 'alert',
    title,
    message,
  });
};

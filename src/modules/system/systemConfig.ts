import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { auditLogger } from '../audit/auditLogger';

export interface FeatureFlags {
  enableAiAssistant: boolean;
  enableRealtimeCourierGps: boolean;
  enableInstantWalletPayouts: boolean;
  enableVolumeDiscounts: boolean;
  enableDarkThemeForced: boolean;
  enableGuestOrdering: boolean;
  enableLoyaltyWheel: boolean;
  enableZeroTrustTelemetry: boolean;
}

export interface RemoteConfig {
  appVersion: string;
  minSupportedVersion: string;
  deliverySlaMinutes: number;
  minimumOrderAmountYER: number;
  freeDeliveryThresholdYER: number;
  driverCommissionPercent: number;
  taxRatePercent: number;
  customerSupportPhone: string;
  emergencyNoticeAr?: string;
}

export interface KillSwitches {
  maintenanceMode: boolean;
  killSwitchCheckout: boolean;
  killSwitchRegistrations: boolean;
  killSwitchDriverAcceptance: boolean;
}

export interface SystemConfigState {
  flags: FeatureFlags;
  remote: RemoteConfig;
  killSwitches: KillSwitches;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_CONFIG: SystemConfigState = {
  flags: {
    enableAiAssistant: true,
    enableRealtimeCourierGps: true,
    enableInstantWalletPayouts: true,
    enableVolumeDiscounts: true,
    enableDarkThemeForced: false,
    enableGuestOrdering: true,
    enableLoyaltyWheel: true,
    enableZeroTrustTelemetry: true
  },
  remote: {
    appVersion: '2.4.0-production',
    minSupportedVersion: '2.0.0',
    deliverySlaMinutes: 30,
    minimumOrderAmountYER: 1000,
    freeDeliveryThresholdYER: 25000,
    driverCommissionPercent: 15,
    taxRatePercent: 0,
    customerSupportPhone: '+967 5 300000',
    emergencyNoticeAr: ''
  },
  killSwitches: {
    maintenanceMode: false,
    killSwitchCheckout: false,
    killSwitchRegistrations: false,
    killSwitchDriverAcceptance: false
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'م. أحمد أمين بن حرهره'
};

const STORAGE_KEY = 'hadramout_system_config_v1';

class SystemConfigService {
  private config: SystemConfigState = DEFAULT_CONFIG;
  private listeners: Set<(config: SystemConfigState) => void> = new Set();
  private isListeningFirestore = false;

  constructor() {
    this.loadFromCache();
    this.initFirestoreListener();
  }

  private loadFromCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Could not read cached system config:', e);
    }
  }

  private saveToCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save system config to cache:', e);
    }
  }

  private notify() {
    const state = { ...this.config };
    this.listeners.forEach((fn) => fn(state));
  }

  private initFirestoreListener() {
    if (this.isListeningFirestore) return;
    this.isListeningFirestore = true;
    try {
      const docRef = doc(db, 'system_config', 'global');
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          this.config = { ...this.config, ...(snapshot.data() as SystemConfigState) };
          this.saveToCache();
          this.notify();
        }
      }, (err) => {
        console.log('System config snapshot status:', err.message);
      });
    } catch (e) {
      console.warn('Firestore system config init error:', e);
    }
  }

  public getConfig(): SystemConfigState {
    return { ...this.config };
  }

  public subscribe(callback: (config: SystemConfigState) => void): () => void {
    this.listeners.add(callback);
    callback({ ...this.config });
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async updateFeatureFlags(
    flags: Partial<FeatureFlags>, 
    actorName = 'Developer', 
    actorRole: any = 'developer'
  ) {
    this.config.flags = { ...this.config.flags, ...flags };
    this.config.updatedAt = new Date().toISOString();
    this.config.updatedBy = actorName;
    this.saveToCache();
    this.notify();

    await auditLogger.logEvent({
      actorName,
      actorRole,
      action: 'FEATURE_FLAGS_UPDATED',
      category: 'system',
      targetEntity: 'FeatureFlags',
      details: flags,
      severity: 'warning'
    });

    this.persistToFirestore();
  }

  public async updateRemoteConfig(
    remote: Partial<RemoteConfig>,
    actorName = 'Developer',
    actorRole: any = 'developer'
  ) {
    this.config.remote = { ...this.config.remote, ...remote };
    this.config.updatedAt = new Date().toISOString();
    this.config.updatedBy = actorName;
    this.saveToCache();
    this.notify();

    await auditLogger.logEvent({
      actorName,
      actorRole,
      action: 'REMOTE_CONFIG_UPDATED',
      category: 'system',
      targetEntity: 'RemoteConfig',
      details: remote,
      severity: 'warning'
    });

    this.persistToFirestore();
  }

  public async toggleKillSwitch(
    key: keyof KillSwitches,
    value: boolean,
    actorName = 'Developer',
    actorRole: any = 'developer'
  ) {
    this.config.killSwitches[key] = value;
    this.config.updatedAt = new Date().toISOString();
    this.config.updatedBy = actorName;
    this.saveToCache();
    this.notify();

    await auditLogger.logEvent({
      actorName,
      actorRole,
      action: `KILL_SWITCH_${key.toUpperCase()}_${value ? 'ENGAGED' : 'DISENGAGED'}`,
      category: 'security',
      targetEntity: 'KillSwitches',
      targetId: key,
      details: `Switched ${key} to ${value ? 'ACTIVE (BLOCKING)' : 'NORMAL'}`,
      severity: 'critical'
    });

    this.persistToFirestore();
  }

  private async persistToFirestore() {
    try {
      // Authoritative system configuration is server-controlled. The client only
      // keeps its local cache; dashboard writes must call the protected API.
      return;
    } catch (e) {
      console.warn('System config Firestore sync (offline fallback active):', e);
    }
  }
}

export const systemConfig = new SystemConfigService();

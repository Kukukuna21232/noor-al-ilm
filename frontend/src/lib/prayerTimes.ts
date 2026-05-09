// Global prayer time calculations and timezone support

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  imsak?: Date;
  midnight?: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
  country: string;
  city?: string;
}

export interface PrayerCalculationMethod {
  name: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaInterval?: number; // minutes after maghrib
  maghribInterval?: number; // minutes after sunset
}

export const CALCULATION_METHODS: Record<string, PrayerCalculationMethod> = {
  muslim_world_league: {
    name: 'Muslim World League',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  egyptian: {
    name: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  karachi: {
    name: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  umm_al_qura: {
    name: 'Umm al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaInterval: 90, // 90 minutes after maghrib
  },
  dubai: {
    name: 'Dubai (UAE)',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
  },
  moonsighting: {
    name: 'Moonsighting Committee',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  north_america: {
    name: 'Islamic Society of North America (ISNA)',
    fajrAngle: 15,
    ishaAngle: 15,
  },
  kuwait: {
    name: 'Kuwait',
    fajrAngle: 18,
    ishaAngle: 17.5,
  },
  qatar: {
    name: 'Qatar',
    fajrAngle: 18,
    ishaInterval: 80,
  },
  singapore: {
    name: 'Singapore',
    fajrAngle: 20,
    ishaInterval: 90,
  },
  turkey: {
    name: 'Turkey',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  tehran: {
    name: 'Institute of Geophysics, University of Tehran',
    fajrAngle: 17.7,
    ishaAngle: 14,
  },
};

export class PrayerTimeCalculator {
  private static readonly DEGREES_TO_RADIANS = Math.PI / 180;
  private static readonly RADIANS_TO_DEGREES = 180 / Math.PI;

  static calculatePrayerTimes(
    date: Date,
    location: Location,
    method: string = 'muslim_world_league',
    asrMethod: 'standard' | 'hanafi' = 'standard'
  ): PrayerTimes {
    const calculationMethod = CALCULATION_METHODS[method] || CALCULATION_METHODS.muslim_world_league;
    
    // Convert to UTC
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    
    // Calculate Julian date
    const jd = this.getJulianDate(utcDate);
    
    // Calculate sun position
    const sunPosition = this.calculateSunPosition(jd);
    
    // Calculate prayer times
    const prayerTimes: any = {
      fajr: this.calculateFajr(jd, location, calculationMethod.fajrAngle),
      sunrise: this.calculateSunrise(jd, location, sunPosition),
      dhuhr: this.calculateDhuhr(jd, location, sunPosition),
      asr: this.calculateAsr(jd, location, sunPosition, asrMethod),
      maghrib: this.calculateMaghrib(jd, location, sunPosition, calculationMethod.maghribInterval),
      isha: this.calculateIsha(jd, location, calculationMethod.ishaAngle, calculationMethod.ishaInterval),
    };

    // Add optional times
    prayerTimes.imsak = this.calculateImsak(prayerTimes.fajr);
    prayerTimes.midnight = this.calculateMidnight(prayerTimes.maghrib, prayerTimes.fajr);

    return prayerTimes;
  }

  private static getJulianDate(date: Date): number {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    
    if (month <= 2) {
      date.setUTCFullYear(year - 1);
      date.setUTCMonth(month + 12);
    }
    
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }

  private static calculateSunPosition(jd: number) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T * T - 0.00000048 * T * T * T;
    const e = 0.016708617 - 0.000042037 * T - 0.0000001236 * T * T;
    const C = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * this.DEGREES_TO_RADIANS) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * this.DEGREES_TO_RADIANS) +
              0.000290 * Math.sin(3 * M * this.DEGREES_TO_RADIANS);
    
    const trueLongitude = L0 + C;
    const trueAnomaly = M + C;
    const radius = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(trueAnomaly * this.DEGREES_TO_RADIANS));
    
    const omega = 125.04 - 1934.136 * T;
    const lambda = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * this.DEGREES_TO_RADIANS);
    const epsilon = 23.439296 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
    
    const alpha = Math.atan2(Math.cos(epsilon * this.DEGREES_TO_RADIANS) * Math.sin(lambda * this.DEGREES_TO_RADIANS),
                           Math.cos(lambda * this.DEGREES_TO_RADIANS)) * this.RADIANS_TO_DEGREES;
    const delta = Math.asin(Math.sin(epsilon * this.DEGREES_TO_RADIANS) * Math.sin(lambda * this.DEGREES_TO_RADIANS)) * this.RADIANS_TO_DEGREES;
    
    const equationOfTime = (L0 - alpha) * 4; // in minutes
    
    return {
      declination: delta,
      equationOfTime,
      hourAngle: Math.acos(-Math.tan((location as any).latitude * this.DEGREES_TO_RADIANS) * 
                           Math.tan(delta * this.DEGREES_TO_RADIANS)) * this.RADIANS_TO_DEGREES
    };
  }

  private static calculateFajr(jd: number, location: Location, fajrAngle: number): Date {
    const sunPosition = this.calculateSunPosition(jd);
    const fajrHourAngle = this.calculateHourAngle(location.latitude, -fajrAngle, sunPosition.declination);
    return this.getTimeFromHourAngle(jd, fajrHourAngle, location);
  }

  private static calculateSunrise(jd: number, location: Location, sunPosition: any): Date {
    const sunriseHourAngle = this.calculateHourAngle(location.latitude, -0.833, sunPosition.declination);
    return this.getTimeFromHourAngle(jd, sunriseHourAngle, location);
  }

  private static calculateDhuhr(jd: number, location: Location, sunPosition: any): Date {
    const dhuhrTime = new Date(jd * 86400000);
    dhuhrTime.setUTCHours(12, 0, 0, 0);
    
    // Adjust for equation of time and longitude
    const adjustment = (location.longitude / 15) - (sunPosition.equationOfTime / 60);
    dhuhrTime.setUTCMinutes(dhuhrTime.getUTCMinutes() + adjustment * 60);
    
    return this.adjustTimezone(dhuhrTime, location.timezone);
  }

  private static calculateAsr(jd: number, location: Location, sunPosition: any, asrMethod: string): Date {
    const factor = asrMethod === 'hanafi' ? 2 : 1;
    const asrAngle = Math.atan(1 / (factor + Math.tan(Math.abs(location.latitude - sunPosition.declination) * this.DEGREES_TO_RADIANS))) * this.RADIANS_TO_DEGREES;
    const asrHourAngle = this.calculateHourAngle(location.latitude, asrAngle, sunPosition.declination);
    return this.getTimeFromHourAngle(jd, asrHourAngle, location);
  }

  private static calculateMaghrib(jd: number, location: Location, sunPosition: any, maghribInterval?: number): Date {
    const maghribTime = this.calculateSunset(jd, location, sunPosition);
    if (maghribInterval) {
      maghribTime.setUTCMinutes(maghribTime.getUTCMinutes() + maghribInterval);
    }
    return maghribTime;
  }

  private static calculateIsha(jd: number, location: Location, ishaAngle: number, ishaInterval?: number): Date {
    if (ishaInterval) {
      const maghrib = this.calculateMaghrib(jd, location, this.calculateSunPosition(jd));
      const ishaTime = new Date(maghrib.getTime());
      ishaTime.setUTCMinutes(ishaTime.getUTCMinutes() + ishaInterval);
      return ishaTime;
    }
    
    const sunPosition = this.calculateSunPosition(jd);
    const ishaHourAngle = this.calculateHourAngle(location.latitude, -ishaAngle, sunPosition.declination);
    return this.getTimeFromHourAngle(jd, ishaHourAngle, location);
  }

  private static calculateSunset(jd: number, location: Location, sunPosition: any): Date {
    const sunsetHourAngle = this.calculateHourAngle(location.latitude, -0.833, sunPosition.declination);
    return this.getTimeFromHourAngle(jd, -sunsetHourAngle, location);
  }

  private static calculateHourAngle(latitude: number, angle: number, declination: number): number {
    const latRad = latitude * this.DEGREES_TO_RADIANS;
    const angleRad = angle * this.DEGREES_TO_RADIANS;
    const decRad = declination * this.DEGREES_TO_RADIANS;
    
    const cosHourAngle = (Math.cos(angleRad) - Math.sin(latRad) * Math.sin(decRad)) / 
                        (Math.cos(latRad) * Math.cos(decRad));
    
    if (cosHourAngle > 1) return 0;
    if (cosHourAngle < -1) return 180;
    
    return Math.acos(cosHourAngle) * this.RADIANS_TO_DEGREES;
  }

  private static getTimeFromHourAngle(jd: number, hourAngle: number, location: Location): Date {
    const baseTime = new Date(jd * 86400000);
    baseTime.setUTCHours(12, 0, 0, 0);
    
    const timeOffset = (hourAngle / 15) * 60; // Convert to minutes
    const longitudeOffset = (location.longitude / 15) * 60;
    
    baseTime.setUTCMinutes(baseTime.getUTCMinutes() + timeOffset + longitudeOffset);
    
    return this.adjustTimezone(baseTime, location.timezone);
  }

  private static adjustTimezone(date: Date, timezone: string): Date {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    
    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
    const day = parseInt(parts.find(p => p.type === 'day')!.value);
    const hour = parseInt(parts.find(p => p.type === 'hour')!.value);
    const minute = parseInt(parts.find(p => p.type === 'minute')!.value);
    const second = parseInt(parts.find(p => p.type === 'second')!.value);
    
    return new Date(year, month, day, hour, minute, second);
  }

  private static calculateImsak(fajr: Date): Date {
    const imsak = new Date(fajr.getTime());
    imsak.setMinutes(imsak.getMinutes() - 10); // 10 minutes before Fajr
    return imsak;
  }

  private static calculateMidnight(maghrib: Date, fajr: Date): Date {
    const duration = fajr.getTime() - maghrib.getTime();
    const midnight = new Date(maghrib.getTime() + duration / 2);
    return midnight;
  }

  static getNextPrayerTime(prayerTimes: PrayerTimes, currentTime: Date = new Date()): { name: string; time: Date; minutesUntil: number } {
    const prayers = [
      { name: 'fajr', time: prayerTimes.fajr },
      { name: 'sunrise', time: prayerTimes.sunrise },
      { name: 'dhuhr', time: prayerTimes.dhuhr },
      { name: 'asr', time: prayerTimes.asr },
      { name: 'maghrib', time: prayerTimes.maghrib },
      { name: 'isha', time: prayerTimes.isha },
    ];

    // Find next prayer
    for (const prayer of prayers) {
      if (prayer.time > currentTime) {
        return {
          name: prayer.name,
          time: prayer.time,
          minutesUntil: Math.floor((prayer.time.getTime() - currentTime.getTime()) / (1000 * 60))
        };
      }
    }

    // If no prayer left today, return tomorrow's Fajr
    const tomorrowFajr = new Date(prayerTimes.fajr);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    
    return {
      name: 'fajr',
      time: tomorrowFajr,
      minutesUntil: Math.floor((tomorrowFajr.getTime() - currentTime.getTime()) / (1000 * 60))
    };
  }

  static formatPrayerTime(date: Date, locale: string = 'en', format12Hour: boolean = true): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format12Hour
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  static getPrayerTimeForDate(
    date: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    method: string = 'muslim_world_league'
  ): PrayerTimes {
    const location: Location = {
      latitude,
      longitude,
      timezone,
      country: 'Unknown'
    };
    
    return this.calculatePrayerTimes(date, location, method);
  }

  static getMonthlyPrayerTimes(
    year: number,
    month: number,
    location: Location,
    method: string = 'muslim_world_league'
  ): PrayerTimes[] {
    const prayerTimes: PrayerTimes[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      prayerTimes.push(this.calculatePrayerTimes(date, location, method));
    }
    
    return prayerTimes;
  }
}

// Location utilities
export class LocationService {
  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // Get country and city from reverse geocoding
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await response.json();
            
            resolve({
              latitude,
              longitude,
              timezone,
              country: data.countryName || 'Unknown',
              city: data.city || data.locality || undefined
            });
          } catch (error) {
            resolve({
              latitude,
              longitude,
              timezone,
              country: 'Unknown'
            });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  static async searchLocation(query: string): Promise<Location[]> {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0&localityLanguage=en&search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      return data.map((item: any) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'UTC',
        country: item.countryName,
        city: item.city || item.locality
      }));
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  static getCalculationMethodForCountry(country: string): string {
    const countryMethods: Record<string, string> = {
      'Saudi Arabia': 'umm_al_qura',
      'United Arab Emirates': 'dubai',
      'Qatar': 'qatar',
      'Kuwait': 'kuwait',
      'Singapore': 'singapore',
      'Turkey': 'turkey',
      'Iran': 'tehran',
      'Egypt': 'egyptian',
      'Pakistan': 'karachi',
      'Bangladesh': 'karachi',
      'India': 'karachi',
      'United States': 'north_america',
      'Canada': 'north_america',
      'United Kingdom': 'muslim_world_league',
      'Germany': 'muslim_world_league',
      'France': 'muslim_world_league',
      'Italy': 'muslim_world_league',
      'Spain': 'muslim_world_league',
      'Netherlands': 'muslim_world_league',
      'Belgium': 'muslim_world_league',
      'Sweden': 'muslim_world_league',
      'Norway': 'muslim_world_league',
      'Denmark': 'muslim_world_league',
      'Finland': 'muslim_world_league',
    };

    return countryMethods[country] || 'muslim_world_league';
  }
}

// Timezone utilities
export class TimezoneService {
  static getAllTimezones(): string[] {
    return Intl.supportedValuesOf('timeZone') as string[];
  }

  static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const tzTime = new Date(utcTime.toLocaleString('en-US', { timeZone: timezone }));
    return (tzTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
  }

  static isDSTActive(timezone: string, date: Date = new Date()): boolean {
    const january = new Date(date.getFullYear(), 0, 1);
    const july = new Date(date.getFullYear(), 6, 1);
    
    const januaryOffset = this.getTimezoneOffset(timezone);
    const julyOffset = this.getTimezoneOffset(timezone);
    const currentOffset = this.getTimezoneOffset(timezone);
    
    return Math.max(januaryOffset, julyOffset) !== currentOffset;
  }

  static formatTimezone(timezone: string, locale: string = 'en'): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
    
    return timeZoneName || timezone;
  }
}

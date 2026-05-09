// Global payment and donation system integration

export interface PaymentProvider {
  name: string;
  id: string;
  supportedCountries: string[];
  currencies: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface PaymentMethod {
  type: 'card' | 'bank' | 'wallet' | 'crypto';
  provider: string;
  methodId: string;
  displayName: string;
  icon: string;
}

export interface DonationTier {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  benefits: string[];
  recurring?: boolean;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    name: 'Stripe',
    id: 'stripe',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'AT', 'NZ', 'SG', 'MY', 'JP', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'IN', 'PH', 'TH', 'VN', 'ID', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA', 'MM', 'NP', 'BT', 'MV'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SYP', 'IQD', 'IRR', 'AFN', 'PKR', 'LKR', 'BDT', 'NPR', 'BTN', 'MVR', 'MMK', 'KHR', 'LAK', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'BND', 'PHP', 'JPY', 'CNY', 'KRW', 'TWD', 'HKD', 'MOP', 'INR', 'LKR', 'MVR', 'PKR', 'AFN', 'BDT', 'BTN', 'KHR', 'LAK', 'MMK', 'MNT', 'NPR', 'LKR'],
    fees: { percentage: 2.9, fixed: 0.30 }
  },
  {
    name: 'PayPal',
    id: 'paypal',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'AT', 'NZ', 'SG', 'MY', 'JP', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'IN', 'PH', 'TH', 'VN', 'ID', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA', 'MM', 'NP', 'BT', 'MV'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SYP', 'IQD', 'IRR', 'AFN', 'PKR', 'LKR', 'BDT', 'NPR', 'BTN', 'MVR', 'MMK', 'KHR', 'LAK', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'BND', 'PHP', 'JPY', 'CNY', 'KRW', 'TWD', 'HKD', 'MOP', 'INR', 'LKR', 'MVR', 'PKR', 'AFN', 'BDT', 'BTN', 'KHR', 'LAK', 'MMK', 'MNT', 'NPR', 'LKR'],
    fees: { percentage: 3.4, fixed: 0.30 }
  },
  {
    name: 'Razorpay',
    id: 'razorpay',
    supportedCountries: ['IN'],
    currencies: ['INR'],
    fees: { percentage: 2.0, fixed: 0 }
  },
  {
    name: 'Mollie',
    id: 'mollie',
    supportedCountries: ['NL', 'BE', 'DE', 'AT', 'FR', 'ES', 'IT', 'GB', 'IE', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'SE', 'NO', 'DK', 'FI'],
    currencies: ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK'],
    fees: { percentage: 2.5, fixed: 0.25 }
  },
  {
    name: 'Adyen',
    id: 'adyen',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'AT', 'NZ', 'SG', 'MY', 'JP', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'IN', 'PH', 'TH', 'VN', 'ID', 'PK', 'BD', 'LK', 'MM', 'KH', 'LA', 'MM', 'NP', 'BT', 'MV'],
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SYP', 'IQD', 'IRR', 'AFN', 'PKR', 'LKR', 'BDT', 'NPR', 'BTN', 'MVR', 'MMK', 'KHR', 'LAK', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'BND', 'PHP', 'JPY', 'CNY', 'KRW', 'TWD', 'HKD', 'MOP', 'INR', 'LKR', 'MVR', 'PKR', 'AFN', 'BDT', 'BTN', 'KHR', 'LAK', 'MMK', 'MNT', 'NPR', 'LKR'],
    fees: { percentage: 2.3, fixed: 0.20 }
  }
];

export const DONATION_TIERS: DonationTier[] = [
  {
    id: 'supporter',
    name: 'Supporter',
    amount: 10,
    currency: 'USD',
    description: 'Support our mission to spread Islamic education globally',
    benefits: ['Monthly newsletter', 'Access to basic courses', 'Community forum access'],
    recurring: true
  },
  {
    id: 'patron',
    name: 'Patron',
    amount: 25,
    currency: 'USD',
    description: 'Become a patron of Islamic education',
    benefits: ['All supporter benefits', 'Advanced course access', 'Priority support', 'Exclusive content'],
    recurring: true
  },
  {
    id: 'benefactor',
    name: 'Benefactor',
    amount: 100,
    currency: 'USD',
    description: 'Major contribution to Islamic education',
    benefits: ['All patron benefits', 'VIP access to events', 'Personalized learning path', 'Certificate of appreciation'],
    recurring: true
  },
  {
    id: 'one-time-gift',
    name: 'One-Time Gift',
    amount: 50,
    currency: 'USD',
    description: 'Single donation to support our cause',
    benefits: ['Tax receipt', 'Thank you certificate', 'Community recognition'],
    recurring: false
  }
];

export class PaymentService {
  private static instance: PaymentService;
  private currentProvider: PaymentProvider | null = null;

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async initializePayment(providerId: string): Promise<void> {
    const provider = PAYMENT_PROVIDERS.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Payment provider ${providerId} not found`);
    }

    this.currentProvider = provider;

    // Initialize provider-specific SDK
    switch (providerId) {
      case 'stripe':
        await this.initializeStripe();
        break;
      case 'paypal':
        await this.initializePayPal();
        break;
      case 'razorpay':
        await this.initializeRazorpay();
        break;
      case 'mollie':
        await this.initializeMollie();
        break;
      case 'adyen':
        await this.initializeAdyen();
        break;
    }
  }

  private async initializeStripe(): Promise<void> {
    // Demo mode - Stripe not needed for client demo
    console.log('Stripe initialization skipped - demo mode');
  }

  private async initializePayPal(): Promise<void> {
    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = () => {
      // PayPal SDK loaded
    };
    document.head.appendChild(script);
  }

  private async initializeRazorpay(): Promise<void> {
    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }

  private async initializeMollie(): Promise<void> {
    // Mollie is server-side only, no client SDK needed
  }

  private async initializeAdyen(): Promise<void> {
    // Load Adyen Web SDK
    const script = document.createElement('script');
    script.src = 'https://checkoutshopper-live.adyen.com/checkoutshopper/sdk/5.28.0/adyen.js';
    script.integrity = 'sha384-+b3rVgP4oZcHbKk5uqL7Jj8uLQzqQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQ';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<any> {
    if (!this.currentProvider) {
      throw new Error('No payment provider initialized');
    }

    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: this.currentProvider.id,
        amount,
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  }

  async processPayment(paymentIntentId: string, paymentMethod: any): Promise<any> {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        paymentMethod,
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    return response.json();
  }

  getSupportedPaymentMethods(userCountry: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [];

    // Common payment methods by region
    if (['US', 'CA', 'GB', 'AU'].includes(userCountry)) {
      methods.push(
        {
          type: 'card',
          provider: 'stripe',
          methodId: 'card',
          displayName: 'Credit/Debit Card',
          icon: '/icons/card.svg'
        },
        {
          type: 'wallet',
          provider: 'paypal',
          methodId: 'paypal',
          displayName: 'PayPal',
          icon: '/icons/paypal.svg'
        }
      );
    }

    if (['IN'].includes(userCountry)) {
      methods.push(
        {
          type: 'card',
          provider: 'razorpay',
          methodId: 'card',
          displayName: 'Credit/Debit Card',
          icon: '/icons/card.svg'
        },
        {
          type: 'wallet',
          provider: 'razorpay',
          methodId: 'upi',
          displayName: 'UPI',
          icon: '/icons/upi.svg'
        },
        {
          type: 'wallet',
          provider: 'razorpay',
          methodId: 'netbanking',
          displayName: 'Net Banking',
          icon: '/icons/bank.svg'
        }
      );
    }

    if (['NL', 'BE', 'DE'].includes(userCountry)) {
      methods.push(
        {
          type: 'card',
          provider: 'mollie',
          methodId: 'creditcard',
          displayName: 'Credit Card',
          icon: '/icons/card.svg'
        },
        {
          type: 'bank',
          provider: 'mollie',
          methodId: 'ideal',
          displayName: 'iDEAL',
          icon: '/icons/ideal.svg'
        }
      );
    }

    // Middle East specific methods
    if (['SA', 'AE', 'QA', 'KW', 'BH', 'OM'].includes(userCountry)) {
      methods.push(
        {
          type: 'card',
          provider: 'stripe',
          methodId: 'card',
          displayName: 'Credit/Debit Card',
          icon: '/icons/card.svg'
        },
        {
          type: 'wallet',
          provider: 'stripe',
          methodId: 'apple_pay',
          displayName: 'Apple Pay',
          icon: '/icons/apple-pay.svg'
        }
      );
    }

    return methods;
  }

  calculateFees(amount: number, providerId: string): number {
    const provider = PAYMENT_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return 0;

    return (amount * provider.fees.percentage / 100) + provider.fees.fixed;
  }

  getLocalizedAmount(amount: number, currency: string, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  async createDonation(tierId: string, recurring: boolean = false): Promise<any> {
    const tier = DONATION_TIERS.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Donation tier ${tierId} not found`);
    }

    return this.createPaymentIntent(
      tier.amount,
      tier.currency,
      {
        type: 'donation',
        tier: tierId,
        recurring,
        tierName: tier.name
      }
    );
  }

  async getExchangeRates(fromCurrency: string, toCurrency: string): Promise<number> {
    const response = await fetch(`/api/payments/exchange-rate?from=${fromCurrency}&to=${toCurrency}`);
    if (!response.ok) {
      throw new Error('Failed to get exchange rate');
    }
    const data = await response.json();
    return data.rate;
  }

  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return Promise.resolve(amount);
    return this.getExchangeRates(fromCurrency, toCurrency).then(rate => amount * rate);
  }
}

// Utility functions for payment processing
export function validatePaymentData(data: any): boolean {
  return !!(
    data.amount &&
    data.currency &&
    data.paymentMethod &&
    data.provider
  );
}

export function formatPaymentError(error: any): string {
  if (error.code === 'card_declined') {
    return 'Your card was declined. Please try a different card.';
  }
  if (error.code === 'insufficient_funds') {
    return 'Insufficient funds. Please check your balance or use a different card.';
  }
  if (error.code === 'processing_error') {
    return 'An error occurred while processing your payment. Please try again.';
  }
  return 'Payment failed. Please try again or contact support.';
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'succeeded': return 'text-green-600';
    case 'pending': return 'text-yellow-600';
    case 'failed': return 'text-red-600';
    case 'cancelled': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}

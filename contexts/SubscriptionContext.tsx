import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";
const TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";

const PREMIUM_ENTITLEMENT = "premium";

type SubscriptionState = {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  showPaywall: boolean;
  setShowPaywall: (v: boolean) => void;
};

const SubscriptionContext = createContext<SubscriptionState>({
  isPremium: false,
  isLoading: true,
  customerInfo: null,
  currentOffering: null,
  purchase: async () => {},
  restore: async () => {},
  showPaywall: false,
  setShowPaywall: () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        let apiKey: string;
        if (Platform.OS === "ios") {
          apiKey = IOS_API_KEY;
        } else if (Platform.OS === "android") {
          apiKey = ANDROID_API_KEY;
        } else {
          apiKey = TEST_API_KEY;
        }

        Purchases.configure({ apiKey });

        const [info, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);

        setCustomerInfo(info);
        setCurrentOffering(offerings.current);
      } catch (e) {
        console.error("RevenueCat init error:", e);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const purchase = useCallback(async () => {
    if (!currentOffering) return;
    const pkg = currentOffering.availablePackages[0];
    if (!pkg) return;
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      setShowPaywall(false);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "userCancelled" in e && e.userCancelled) return;
      throw e;
    }
  }, [currentOffering]);

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      if (info.entitlements.active[PREMIUM_ENTITLEMENT]) {
        setShowPaywall(false);
      }
    } catch (e) {
      console.error("Restore error:", e);
    }
  }, []);

  const isPremium = Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT]);

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, isLoading, customerInfo, currentOffering, purchase, restore, showPaywall, setShowPaywall }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

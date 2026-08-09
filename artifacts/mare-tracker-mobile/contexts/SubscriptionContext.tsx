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

    /** How many mares a free (non-subscribed) user can manage before hitting the paywall. */
    export const FREE_MARE_LIMIT = 1;

    type SubscriptionState = {
    isPremium: boolean;
    isLoading: boolean;
    /** True when user is not premium but still has free capacity (hasn't hit FREE_MARE_LIMIT). */
    isOnFreeTier: boolean;
    customerInfo: CustomerInfo | null;
    currentOffering: PurchasesOffering | null;
    purchase: () => Promise<void>;
    restore: () => Promise<void>;
    showPaywall: boolean;
    setShowPaywall: (v: boolean) => void;
    /** Updated by screens that know the current mare count. */
    freeMareCount: number;
    setFreeMareCount: (n: number) => void;
    };

    const SubscriptionContext = createContext<SubscriptionState>({
    isPremium: false,
    isLoading: true,
    isOnFreeTier: true,
    customerInfo: null,
    currentOffering: null,
    purchase: async () => {},
    restore: async () => {},
    showPaywall: false,
    setShowPaywall: () => {},
    freeMareCount: 0,
    setFreeMareCount: () => {},
    });

    export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [freeMareCount, setFreeMareCount] = useState(0);

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
      if (!currentOffering) {
        throw new Error("Subscription products could not be loaded. Please check your internet connection and try again.");
      }
      const pkg = currentOffering.availablePackages[0];
      if (!pkg) {
        throw new Error("No subscription package available. Please try again later.");
      }
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
    // User is "on free tier" if they're not premium AND still have free slots available
    const isOnFreeTier = !isPremium && freeMareCount < FREE_MARE_LIMIT;

    return (
      <SubscriptionContext.Provider
        value={{
          isPremium,
          isLoading,
          isOnFreeTier,
          customerInfo,
          currentOffering,
          purchase,
          restore,
          showPaywall,
          setShowPaywall,
          freeMareCount,
          setFreeMareCount,
        }}
      >
        {children}
      </SubscriptionContext.Provider>
    );
    }

    export function useSubscription() {
    return useContext(SubscriptionContext);
    }
    
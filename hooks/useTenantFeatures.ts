import { useSupabase } from './useSupabase'; // Assuming this exists based on common patterns
import { useMemo } from 'react';

export interface RioFeatures {
    enabled: boolean;
    rag: boolean;
    memory: boolean;
    actions: boolean;
}

export interface TenantFeatures {
    rio: RioFeatures;
    [key: string]: any;
}

const DEFAULT_RIO_FEATURES: RioFeatures = {
    enabled: false,
    rag: false,
    memory: false,
    actions: false,
};

/**
 * Hook to retrieve and parse tenant feature flags with fail-closed defaults.
 * Typically used within a Tenant context or Page layout.
 */
export function useTenantFeatures(tenantData: any) {
    return useMemo(() => {
        const features = tenantData?.features || {};
        const rio = features.rio || {};

        return {
            ...features,
            rio: {
                enabled: Boolean(rio.enabled),
                rag: Boolean(rio.rag),
                memory: Boolean(rio.memory),
                actions: Boolean(rio.actions),
            },
        } as TenantFeatures;
    }, [tenantData]);
}

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';

declare global {
    interface Window { paypal?: any; }
}

/**
 * Dynamically loads the PayPal JS SDK and provides order helpers.
 * The SDK script is loaded once and reused across re-renders.
 */
export function usePayPal() {
    const [ready, setReady] = useState(!!window.paypal);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    useEffect(() => {
        if (window.paypal || loadingRef.current) {
            if (window.paypal) setReady(true);
            return;
        }
        loadingRef.current = true;

        (async () => {
            try {
                const { clientId } = await apiFetch('/purchase/config');
                if (!clientId) { setError('Payment system unavailable.'); return; }

                const script = document.createElement('script');
                script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture&locale=de_DE`;
                script.async = true;
                script.onload = () => { setReady(true); };
                script.onerror = () => { setError('Failed to load payment provider.'); };
                document.head.appendChild(script);
            } catch {
                setError('Payment configuration unavailable.');
            }
        })();
    }, []);

    const createOrder = async (productId?: string): Promise<string> => {
        const { orderId } = await apiFetch('/purchase/create-order', {
            method: 'POST',
            body: JSON.stringify({ productId }),
        });
        return orderId;
    };

    const fetchProducts = async () => {
        return apiFetch('/purchase/products');
    };

    const captureOrder = async (orderId: string) => {
        return apiFetch('/purchase/capture-order', {
            method: 'POST',
            body: JSON.stringify({ orderId }),
        });
    };

    return { ready, error, createOrder, captureOrder, fetchProducts };
}

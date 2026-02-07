// import { Loader } from "../../../../ui-components/Loader";
import React, {useEffect, useRef} from "react";
import { getAuthorizerUrl} from "../../../lib/api.ts";
import Loader from "../../../components/Loader/Loader.tsx";
import {AlertCard} from "../../../components/feedback/AlertCard.tsx";
// import {getAppInfo} from "../../../lib/httpClient.ts";

export const LoginRedirect = () => {
    const hasFetchedRef = useRef(false);
    const [failed, setFailed] = React.useState(false);

    useEffect(() => {
        if (hasFetchedRef.current) return; // Prevent double-call in React 18 StrictMode (dev)
        hasFetchedRef.current = true;

        (async () => {
            try {
                const authUrl = await getAuthorizerUrl();
                const url = authUrl?.data;
                if (url) {
                    alert('Please login to continue');
                    alert(url);
                    // @ts-ignore
                    window.location.replace(url);
                }
            } catch (e) {
                setFailed(true);
                // Optionally: show an error or fallback UI
                console.error('Failed to fetch authorizer URL', e);
            }
        })();
    }, [hasFetchedRef]);

    return (
        <>
            <Loader className={`${failed ? 'hidden' : ''}`}
                    fullscreen={!failed}
                    message={`${!failed ? "Loading your Sign in component..." :  ''}`}
                    size="md" />
            <AlertCard intent="error" title=""
                       className={`${failed ? 'fixed inset-0 z-50 flex items-center justify-center' : 'hidden'}`}>
                <span className="font-bold text-3xl">This Application has not been registered with the ESGC. Please contact your administrator.</span>
            </AlertCard>
            {/*f*/}
        </>
    );
}
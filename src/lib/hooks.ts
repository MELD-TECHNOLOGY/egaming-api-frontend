import {UserProfile} from "./appModels.ts";
import {useCallback, useEffect, useState} from "react";
import {getProfile} from "./checkPrivilege.ts";


export const useUserProfile = (): UserProfile => {
    const [user, setUser] = useState<UserProfile>();

    useEffect(() => {
        const profile = getProfile();
        setUser(profile);
    }, []);

    return <UserProfile>user;
}

export const useRefresh = () => {

    // Soft refresh (reset React state by triggering a "version" change)
    const softRefresh = useCallback(() => {
        window.dispatchEvent(new Event("app:soft-refresh"));
    }, []);

    // Hard reload (full browser reload)
    const hardRefresh = useCallback((url: string) => {
        window.location.replace(url);
    }, []);

    return { softRefresh, hardRefresh };
};
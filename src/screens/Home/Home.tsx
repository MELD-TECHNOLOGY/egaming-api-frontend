import { useEffect } from 'react';
import {useNavigate } from "react-router-dom";
import Loader from "../../components/Loader/Loader.tsx";
import {setAppInfo} from "../../lib/api.ts";

export const Home = (): JSX.Element => {
    const navigate = useNavigate();
    useEffect(() => {
        // This help solve the fetching of auth url issue
        setAppInfo('isApp', 'true');
        navigate(`/auth/login`, {replace: true });
    }, [navigate]);

    return ( <Loader fullscreen message="Redirecting to sign in..." size="md" /> );
}
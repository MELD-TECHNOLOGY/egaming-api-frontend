import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

export const RefreshedView: React.FC = () => {
    const [ ,setRefreshToggle] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Set a timer to update the state every 10 seconds (10000 milliseconds)
        const intervalId = setInterval(() => {
            setRefreshToggle(prev => !prev);
            navigate("/", { replace: true });
        }, 120000);

        // This cleanup function runs when the component unmounts
        return () => clearInterval(intervalId);
    }, []); // The empty dependency array ensures this effect runs only once

    return (<></>);
};
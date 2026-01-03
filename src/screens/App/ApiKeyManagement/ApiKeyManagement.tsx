
// Helper to get operator from router state or query
import {useEffect, useState} from "react";
import {ApiKeyData, OperatorData} from "../../../lib/appModels.ts";
import {useLocation, useNavigate} from "react-router-dom";
import {Sidebar} from "../../../components/Sidebar";
import {Header} from "../../../components/Header";
import {Copy, Eye, EyeOff, Key} from "lucide-react";
import {ApiKeyRequest, createApiKeyClient, fetchApiKeyClient, rotateApiKeyClient} from "../../../lib/api.ts";
import {Spinner} from "../../../components/common/Spinner.tsx";

function useOperatorFromRoute(): OperatorData | null {
    const navigate = useNavigate();
    const { state, } = useLocation();
    const operatorFromState = (state as any)?.operator as OperatorData | undefined;
    const operator = operatorFromState || null;

    useEffect(() => {
        if (!operator) {
            // If the user landed here without an operator, redirect back to operators list
            navigate("/app/dashboard", { replace: true });
        }
    }, [operator, navigate]);

    return operator;
}

export const ApiKeyManagement = (): JSX.Element => {
    const operatorData = useOperatorFromRoute();
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [newApiKey, setNewApiKey] = useState<boolean>(false);
    const [showApiKeys, setShowApiKeys] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null| undefined>(null);
    const [clientApiKey, setClientApiKey] = useState<ApiKeyData | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleApiKeyVisibility = () => {
        setShowApiKeys(!showApiKeys);
    };

    const copyApiKey = (keyId: string | undefined, apiKey: string | undefined) => {
        // Check if the Clipboard API is available
        if (navigator.clipboard && window.isSecureContext) {
            // Use the modern Clipboard API
            if (apiKey != null) {
                navigator.clipboard.writeText(apiKey).then(() => {
                    console.log('API key copied to clipboard successfully');
                    setCopiedKeyId(keyId);
                    setTimeout(() => setCopiedKeyId(null), 2000); // Hide after 2 seconds
                }).catch(err => {
                    console.error('Failed to copy with Clipboard API: ', err);
                    fallbackCopyTextToClipboard(apiKey);
                    setCopiedKeyId(keyId);
                    setTimeout(() => setCopiedKeyId(null), 2000);
                });
            }
        } else {
            // Use a fallback method
            fallbackCopyTextToClipboard(apiKey);
            setCopiedKeyId(keyId);
            setTimeout(() => setCopiedKeyId(null), 2000);
        }
    };

    const fallbackCopyTextToClipboard = (text: string | null | undefined) => {
        const textArea = document.createElement('textarea');
        textArea.value = text ?? 'No API key available.';

        // Avoid scrolling to the bottom
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('API key copied to clipboard using fallback method');
            } else {
                console.error('Failed to copy using fallback method');
            }
        } catch (err) {
            console.error('Error in fallback copy method: ', err);
        }

        document.body.removeChild(textArea);
    };

    const handleGenerateApiKey = async () => {
        setLoading(true);
        try {
            const requestBody: ApiKeyRequest = {
                publicId: operatorData?.publicId as string,
                name: operatorData?.name as string,
                apiKey: "default",
                role: 'OPERATOR_API_USER',
                rateLimitConfig: {
                    remainingTokens: 50,
                    capacity: 50,
                    refillPeriod: 30,
                    refillTimeUnit: 'SECOND'
                }
            }
            const resp = await createApiKeyClient(requestBody);
            const apiClient = resp?.data;
            setHasApiKey(apiClient?.data?.publicId !== null);
            setClientApiKey(apiClient?.data);
            setNewApiKey(true);
        }catch (_) {}
        finally {
            setLoading(false);
        }
    }

    const handleRegenerateApiKey = async () => {
        setLoading(true);
        try {
            const resp = await rotateApiKeyClient(operatorData?.publicId);
            const apiClient = resp?.data;
            setHasApiKey(apiClient?.data?.publicId !== null);
            setClientApiKey(apiClient?.data);
            setNewApiKey(true);
        }catch (_) {}
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if(operatorData?.publicId) {
            (async () => {
                try {
                    const resp = await fetchApiKeyClient(operatorData?.publicId);
                    const apiClient = resp?.data;
                    setHasApiKey(apiClient?.data?.publicId !== null);
                    setClientApiKey(apiClient?.data);
                }catch (err){
                    // @ts-ignore
                    if(err.status === 404) setHasApiKey(false);
                    setClientApiKey(null);
                }
            })().finally(
                () => {}
            )
        }
    }, []);


    return (
        <div className="flex min-h-screen bg-gray-5">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
             />

            <div className="flex-1 flex flex-col">
                <Header title={'Api Key Management'} />

                <div className="flex-1 p-4 md:p-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-blue-600 mb-2">
                            {operatorData?.name} Developer Api Key
                        </h2>
                        <p className="text-gray-60">
                            Manage your API keys for system integration
                        </p>
                    </div>
                    {(loading) ? (
                        <div className="flex items-center justify-center p-10">
                            <Spinner label="Loading..." />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Current Api Key</h3>
                                <button className={`${hasApiKey? 'hidden' : 'text-blue-600 hover:underline'}`}
                                        type="button"
                                        onClick={handleGenerateApiKey}>
                                    Generate
                                </button>
                                <button className={`${hasApiKey? 'text-blue-600 hover:underline' : 'hidden'}`}
                                        type="button"
                                        onClick={handleRegenerateApiKey}>
                                    Regenerate
                                </button>
                            </div>
                            <div className={`${newApiKey? '': 'hidden'} bg-gray-800 p-4 rounded-lg shadow-md`}>
                                <h3 className="text-md font-semibold text-gray-300">
                                    Make sure to copy your Api Key now as you not be able to see it again.
                                </h3>
                            </div>
                            {(!hasApiKey) ? (
                                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                                    <p className="text-gray-600">No API key available. Please generate one.</p>
                                </div>) : (
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Key className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900"><span className="bold">Id: </span>{clientApiKey?.publicId}</h3>
                                                <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    'bg-green-100 text-green-800'
                            `}>
                              {clientApiKey?.revoked ? 'Revoked' : 'Active'}
                            </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                API Key
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type={showApiKeys ? 'text' : 'password'}
                                                    value={showApiKeys ? clientApiKey?.apiKey : '••••••••••••••••'}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                                                />
                                                <button
                                                    onClick={toggleApiKeyVisibility}
                                                    className={`${newApiKey? '' : 'hidden'} p-2 text-gray-500 hover:text-gray-700 transition-colors`}
                                                >
                                                    {showApiKeys ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        copyApiKey(clientApiKey?.publicId, clientApiKey?.apiKey);
                                                    }}
                                                    className={`${newApiKey? '' : 'hidden'} p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500
                                                     'text-green-600 bg-green-50'
                                            `}
                                                    title="Copy API key"
                                                    type="button"
                                                >
                                                    {copiedKeyId === clientApiKey?.publicId ? (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-xs font-medium">Copied!</span>
                                                        </div>
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Created:</span>
                                                <span className="ml-2 text-gray-900">{ // @ts-ignore
                                                    new Date(clientApiKey?.createdOn * 1000).toDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* API Documentation */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                                        <h3 className="font-semibold text-blue-900 mb-2">API Documentation</h3>
                                        <p className="text-blue-700 text-sm mb-4">
                                            Learn how to integrate with our API and manage your gaming operations programmatically.
                                        </p>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                onClick={() => window.open('http://stake-api.meld-tech.com/docs/developer/index.html#tag--Stake-Registration', '_blank')}>
                                            View Documentation →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
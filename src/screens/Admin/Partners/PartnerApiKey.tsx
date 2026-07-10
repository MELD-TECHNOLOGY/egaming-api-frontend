import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Eye, EyeOff, Key } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/common/Spinner';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { useToast } from '../../../components/feedback/Toast';
import { ApiError, createApiKeyClient, fetchApiKeyClient, rotateApiKeyClient } from '../../../lib/api';
import { ApiKeyRequest } from '../../../lib/models';
import { ApiKeyData, PlatformPartnerData } from '../../../lib/appModels';

const PARTNER_API_ROLE: ApiKeyRequest['role'] = 'PARTNER_API_USER';

function usePartnerFromRoute(): PlatformPartnerData | null {
    const navigate = useNavigate();
    const { state } = useLocation();
    const partner = (state as { partner?: PlatformPartnerData } | null)?.partner ?? null;

    useEffect(() => {
        if (!partner) {
            navigate('/admin/partners', { replace: true });
        }
    }, [partner, navigate]);

    return partner;
}

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const PartnerApiKey = (): JSX.Element => {
    const toast = useToast();
    const navigate = useNavigate();
    const partner = usePartnerFromRoute();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [clientApiKey, setClientApiKey] = useState<ApiKeyData | null>(null);

    const fallbackCopyTextToClipboard = (text: string | null | undefined) => {
        const textArea = document.createElement('textarea');
        textArea.value = text ?? 'No API key available.';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    const copyApiKey = async (keyId: string | undefined, apiKey: string | undefined) => {
        if (!apiKey) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(apiKey);
            } else {
                fallbackCopyTextToClipboard(apiKey);
            }
            setCopiedKeyId(keyId ?? null);
            setTimeout(() => setCopiedKeyId(null), 2000);
        } catch {
            fallbackCopyTextToClipboard(apiKey);
            setCopiedKeyId(keyId ?? null);
            setTimeout(() => setCopiedKeyId(null), 2000);
        }
    };

    const loadApiKey = async () => {
        if (!partner?.publicId) return;
        setInitialLoading(true);
        try {
            const resp = await fetchApiKeyClient(partner.publicId);
            const apiClient = resp.data.data;
            setHasApiKey(!!apiClient?.publicId);
            setClientApiKey(apiClient);
            setNewApiKey(false);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                setHasApiKey(false);
                setClientApiKey(null);
            } else {
                toast.show({ type: 'error', title: 'API key lookup failed', message: toErrorMessage(error) });
            }
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadApiKey();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partner?.publicId]);

    const handleGenerateApiKey = async () => {
        if (!partner) return;
        setLoading(true);
        try {
            const requestBody: ApiKeyRequest = {
                publicId: partner.publicId,
                name: partner.partnerName,
                apiKey: 'default',
                role: PARTNER_API_ROLE,
                rateLimitConfig: {
                    remainingTokens: 50,
                    capacity: 50,
                    refillPeriod: 30,
                    refillTimeUnit: 'SECOND',
                },
            };
            const resp = await createApiKeyClient(requestBody);
            const apiClient = resp.data.data;
            setHasApiKey(!!apiClient?.publicId);
            setClientApiKey(apiClient);
            setNewApiKey(true);
            setShowApiKey(true);
        } catch (error) {
            toast.show({ type: 'error', title: 'Generate failed', message: toErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateApiKey = async () => {
        if (!partner) return;
        setLoading(true);
        try {
            const resp = await rotateApiKeyClient(partner.publicId);
            const apiClient = resp.data.data;
            setHasApiKey(!!apiClient?.publicId);
            setClientApiKey(apiClient);
            setNewApiKey(true);
            setShowApiKey(true);
        } catch (error) {
            toast.show({ type: 'error', title: 'Regenerate failed', message: toErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-5">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 flex flex-col">
                <Header title="Partner API Key" />
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <Button variant="ghost" className="mb-3 px-0" onClick={() => navigate('/admin/partners')}>
                                <ArrowLeft className="w-4 h-4" />
                                Back to Partners
                            </Button>
                            <h2 className="text-2xl font-bold text-gray-80 mb-2">
                                {partner?.partnerName ?? 'Partner'} - Partner API Key
                            </h2>
                            <div className="flex items-center gap-3">
                                <p className="text-gray-60">Generate and rotate API keys for partner integrations</p>
                                <StatusBadge status={partner?.status} />
                            </div>
                        </div>
                    </div>

                    {initialLoading || loading ? (
                        <div className="flex items-center justify-center p-10">
                            <Spinner label="Loading..." />
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-20 p-6 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold text-gray-80">Current API Key</h3>
                                {!hasApiKey ? (
                                    <Button className="bg-primary-500 text-white hover:bg-primary-600" onClick={handleGenerateApiKey}>
                                        Generate
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={handleRegenerateApiKey}>
                                        Regenerate
                                    </Button>
                                )}
                            </div>

                            {newApiKey && (
                                <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                                    <h3 className="text-sm font-semibold text-gray-300">
                                        Copy this API key now. It will not be shown again after you leave or refresh this screen.
                                    </h3>
                                </div>
                            )}

                            {!hasApiKey ? (
                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <p className="text-gray-600">No API key available. Please generate one.</p>
                                </div>
                            ) : (
                                <div className="border border-gray-20 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <Key className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-90">ID: {clientApiKey?.publicId}</h3>
                                                <StatusBadge status={clientApiKey?.revoked ? 'REVOKED' : 'ACTIVE'} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-70 mb-1">API Key</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    value={showApiKey ? clientApiKey?.apiKey ?? '' : '****************'}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 border border-gray-30 rounded-lg bg-gray-5 text-sm font-mono"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={newApiKey ? '' : 'hidden'}
                                                    onClick={() => setShowApiKey((visible) => !visible)}
                                                    title={showApiKey ? 'Hide API key' : 'Show API key'}
                                                >
                                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={newApiKey ? 'text-green-600 bg-green-50' : 'hidden'}
                                                    onClick={() => copyApiKey(clientApiKey?.publicId, clientApiKey?.apiKey)}
                                                    title="Copy API key"
                                                >
                                                    {copiedKeyId === clientApiKey?.publicId ? (
                                                        <span className="text-xs font-medium">Copied</span>
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-500">Created:</span>
                                            <span className="ml-2 text-gray-900">
                                                {clientApiKey?.createdOn ? new Date(clientApiKey.createdOn * 1000).toDateString() : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

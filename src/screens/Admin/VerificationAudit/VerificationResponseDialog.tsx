import { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/common/Spinner';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ApiError, fetchVerificationResponse } from '../../../lib/api';
import { VerificationResponseData } from '../../../lib/appModels';

type VerificationResponseDialogProps = {
    open: boolean;
    requestPublicId?: string | null;
    onOpenChange: (open: boolean) => void;
};

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const VerificationResponseDialog = ({ open, requestPublicId, onOpenChange }: VerificationResponseDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<VerificationResponseData | null>(null);
    const [error, setError] = useState('');
    const [notFound, setNotFound] = useState(false);

    const loadResponse = useCallback(async () => {
        if (!requestPublicId) return;
        setLoading(true);
        setError('');
        setNotFound(false);
        setResponse(null);
        try {
            const resp = await fetchVerificationResponse(requestPublicId);
            setResponse(resp.data.data);
        } catch (loadError) {
            if (loadError instanceof ApiError && loadError.status === 404) {
                setNotFound(true);
            } else {
                setError(toErrorMessage(loadError));
            }
        } finally {
            setLoading(false);
        }
    }, [requestPublicId]);

    useEffect(() => {
        if (open) {
            loadResponse();
        }
    }, [open, loadResponse]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Verification Response</DialogTitle>
                    <DialogDescription>Audit response details for the selected request.</DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center p-10">
                        <Spinner label="Loading response..." />
                    </div>
                )}

                {!loading && notFound && (
                    <div className="rounded-lg border border-gray-20 bg-gray-5 p-6 text-sm text-gray-60">
                        No response has been recorded for this request yet.
                    </div>
                )}

                {!loading && error && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
                        <Button type="button" variant="outline" onClick={loadResponse}>Retry</Button>
                    </div>
                )}

                {!loading && response && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-60">Response ID</p>
                                <p className="font-medium text-gray-80">{response.publicId || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-60">Request ID</p>
                                <p className="font-medium text-gray-80">{response.verificationRequestPublicId || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-60">Status</p>
                                <StatusBadge status={response.status} />
                            </div>
                            <div>
                                <p className="text-gray-60">Response Date</p>
                                <p className="font-medium text-gray-80">{formatDateTime(response.responseDate)}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-gray-60">Message</p>
                                <p className="font-medium text-gray-80">{response.message || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-80 mb-2">Payload</p>
                            <pre className="bg-gray-5 rounded-lg p-4 text-xs font-mono overflow-auto max-h-80">
                                {JSON.stringify(response.responsePayload ?? {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

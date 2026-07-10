import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { CInput } from '../../../components/form/CInput';
import { matches, maxLen, required } from '../../../components/form/validators';
import { LoadingButton } from '../../../components/feedback/LoadingButton';
import { useToast } from '../../../components/feedback/Toast';
import { ApiError, createServiceLevelAgreement, updateServiceLevelAgreement } from '../../../lib/api';
import { ServiceLevelAgreementData, SlaStatus } from '../../../lib/appModels';
import { ServiceLevelAgreementRequest } from '../../../lib/models';

const UPDATE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];
const SLA_STATUSES: SlaStatus[] = ['ACTIVE', 'INACTIVE'];
const NONE = 'none';

type FormState = {
    name: string;
    verificationResponseTime: string;
    updateFrequency: string;
    status: SlaStatus;
};

type SlaFormDialogProps = {
    open: boolean;
    sla?: ServiceLevelAgreementData | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const emptyForm = (): FormState => ({
    name: '',
    verificationResponseTime: '',
    updateFrequency: '',
    status: 'ACTIVE',
});

const cleanOptional = (value: string) => {
    const trimmed = value.trim();
    return trimmed || undefined;
};

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const SlaFormDialog = ({ open, sla, onOpenChange, onSuccess }: SlaFormDialogProps) => {
    const toast = useToast();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!sla;

    useEffect(() => {
        if (!open) return;
        setServerError('');
        setForm({
            name: sla?.name ?? '',
            verificationResponseTime: sla?.verificationResponseTime ? String(sla.verificationResponseTime) : '',
            updateFrequency: sla?.updateFrequency ?? '',
            status: sla?.status ?? 'ACTIVE',
        });
    }, [open, sla]);

    const clientError = useMemo(() => {
        if (!form.name.trim()) return 'Name is required.';
        if (form.name.length > 150) return 'Name must be at most 150 characters.';
        if (!form.verificationResponseTime.trim()) return 'Verification response time is required.';
        if (!/^[1-9]\d*$/.test(form.verificationResponseTime)) {
            return 'Verification response time must be a whole number of at least 1.';
        }
        return '';
    }, [form]);

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setServerError('');
    };

    const buildPayload = (): ServiceLevelAgreementRequest => ({
        name: form.name.trim(),
        verificationResponseTime: Number(form.verificationResponseTime),
        updateFrequency: cleanOptional(form.updateFrequency),
        status: form.status,
    });

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (clientError) {
            setServerError(clientError);
            return;
        }

        setSubmitting(true);
        setServerError('');
        try {
            if (isEdit && sla?.publicId) {
                await updateServiceLevelAgreement(sla.publicId, buildPayload());
            } else {
                await createServiceLevelAgreement(buildPayload());
            }
            toast.show({
                type: 'success',
                title: isEdit ? 'SLA updated' : 'SLA created',
                message: isEdit ? 'The SLA was updated.' : 'The SLA was created.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const message = toErrorMessage(error);
            setServerError(message);
            toast.show({ type: 'error', title: 'SLA request failed', message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
            <DialogContent className="bg-white max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit SLA' : 'Add SLA'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Update service level terms.' : 'Create a service level agreement.'}
                        </DialogDescription>
                    </DialogHeader>

                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CInput
                            name="name"
                            label="Name"
                            value={form.name}
                            required
                            validate={[required(), maxLen(150)]}
                            onChange={(e) => updateField('name', e.target.value)}
                        />
                        <CInput
                            name="verificationResponseTime"
                            label="Verification Response Time"
                            type="number"
                            min={1}
                            value={form.verificationResponseTime}
                            required
                            validate={[required(), matches(/^[1-9]\d*$/, 'Must be a whole number of at least 1')]}
                            onChange={(e) => updateField('verificationResponseTime', e.target.value)}
                        />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Update Frequency</label>
                            <Select
                                value={form.updateFrequency || NONE}
                                onValueChange={(value) => updateField('updateFrequency', value === NONE ? '' : value)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NONE}>Not set</SelectItem>
                                    {UPDATE_FREQUENCIES.map((frequency) => (
                                        <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Status</label>
                            <Select value={form.status} onValueChange={(value) => updateField('status', value as SlaStatus)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SLA_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <LoadingButton type="submit" loading={submitting} className="bg-primary-500 text-white hover:bg-primary-600">
                            {isEdit ? 'Save Changes' : 'Create SLA'}
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

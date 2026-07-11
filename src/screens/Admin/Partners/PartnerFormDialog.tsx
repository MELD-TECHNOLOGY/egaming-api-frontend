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
import { email, matches, maxLen, required } from '../../../components/form/validators';
import { LoadingButton } from '../../../components/feedback/LoadingButton';
import { useToast } from '../../../components/feedback/Toast';
import { ApiError, createPlatformPartner, updatePlatformPartner } from '../../../lib/api';
import { PlatformPartnerData, PartnerStatus, PartnerType } from '../../../lib/appModels';
import { PlatformPartnerRequest } from '../../../lib/models';
import { getProfile } from '../../../lib/checkPrivilege';

const PARTNER_TYPES: PartnerType[] = [
    'GOOGLE',
    'META',
    'APPLE',
    'PAYMENT_PROVIDER',
    'SOCIAL_MEDIA',
    'APP_STORE',
    'AD_NETWORK',
];

const PARTNER_STATUSES: PartnerStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'];

type FormState = {
    partnerCode: string;
    partnerName: string;
    partnerType: PartnerType | '';
    country: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    website: string;
    status: PartnerStatus;
    userId: string;
};

type PartnerFormDialogProps = {
    open: boolean;
    partner?: PlatformPartnerData | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const emptyForm = (): FormState => ({
    partnerCode: '',
    partnerName: '',
    partnerType: '',
    country: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    status: 'PENDING',
    userId: '',
});

const optional = (validator: (value: string) => string | null) => (value: string) => value ? validator(value) : null;

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

export const PartnerFormDialog = ({ open, partner, onOpenChange, onSuccess }: PartnerFormDialogProps) => {
    const toast = useToast();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!partner;

    useEffect(() => {
        if (!open) return;
        const currentUserPublicId = getProfile()?.publicId ?? '';
        setServerError('');
        setForm({
            partnerCode: partner?.partnerCode ?? '',
            partnerName: partner?.partnerName ?? '',
            partnerType: partner?.partnerType ?? '',
            country: partner?.country ?? '',
            contactName: partner?.contactName ?? '',
            contactEmail: partner?.contactEmail ?? '',
            contactPhone: partner?.contactPhone ?? '',
            website: partner?.website ?? '',
            status: partner?.status ?? 'PENDING',
            userId: partner?.userId ?? currentUserPublicId,
        });
    }, [open, partner]);

    const clientError = useMemo(() => {
        if (!form.partnerCode.trim()) return 'Partner code is required.';
        if (form.partnerCode.length > 50) return 'Partner code must be at most 50 characters.';
        if (!form.partnerName.trim()) return 'Partner name is required.';
        if (form.partnerName.length > 150) return 'Partner name must be at most 150 characters.';
        if (!form.partnerType) return 'Partner type is required.';
        if (form.contactEmail && email()(form.contactEmail)) return 'Enter a valid contact email.';
        if (form.website && matches(/^https?:\/\/\S+$/i, 'Enter a valid URL starting with http:// or https://')(form.website)) {
            return 'Enter a valid URL starting with http:// or https://.';
        }
        return '';
    }, [form]);

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setServerError('');
    };

    const buildPayload = (): PlatformPartnerRequest => ({
        partnerCode: form.partnerCode.trim(),
        partnerName: form.partnerName.trim(),
        partnerType: form.partnerType as PartnerType,
        country: cleanOptional(form.country),
        contactName: cleanOptional(form.contactName),
        contactEmail: cleanOptional(form.contactEmail),
        contactPhone: cleanOptional(form.contactPhone),
        website: cleanOptional(form.website),
        status: form.status,
        userId: cleanOptional(form.userId),
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
            if (isEdit && partner?.publicId) {
                await updatePlatformPartner(partner.publicId, buildPayload());
            } else {
                await createPlatformPartner(buildPayload());
            }
            toast.show({
                type: 'success',
                title: isEdit ? 'Partner updated' : 'Partner created',
                message: isEdit ? 'The partner record was updated.' : 'The partner record was created.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const message = toErrorMessage(error);
            setServerError(message);
            toast.show({ type: 'error', title: 'Partner request failed', message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
            <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? 'Update the partner details.' : 'Create a global platform partner.'}
                        </DialogDescription>
                    </DialogHeader>

                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CInput
                            name="partnerCode"
                            label="Partner Code"
                            value={form.partnerCode}
                            required
                            validate={[required(), maxLen(50)]}
                            onChange={(e) => updateField('partnerCode', e.target.value)}
                        />
                        <CInput
                            name="partnerName"
                            label="Partner Name"
                            value={form.partnerName}
                            required
                            validate={[required(), maxLen(150)]}
                            onChange={(e) => updateField('partnerName', e.target.value)}
                        />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Partner Type</label>
                            <Select value={form.partnerType || undefined} onValueChange={(value) => updateField('partnerType', value as PartnerType)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select partner type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PARTNER_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Status</label>
                            <Select value={form.status} onValueChange={(value) => updateField('status', value as PartnerStatus)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PARTNER_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <CInput name="country" label="Country" value={form.country} onChange={(e) => updateField('country', e.target.value)} />
                        <CInput name="contactName" label="Contact Name" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} />
                        <CInput
                            name="contactEmail"
                            label="Contact Email"
                            type="email"
                            value={form.contactEmail}
                            validate={optional(email())}
                            onChange={(e) => updateField('contactEmail', e.target.value)}
                        />
                        <CInput name="contactPhone" label="Contact Phone" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} />
                        <CInput
                            name="website"
                            label="Website"
                            type="url"
                            value={form.website}
                            validate={optional(matches(/^https?:\/\/\S+$/i, 'Enter a valid URL starting with http:// or https://'))}
                            onChange={(e) => updateField('website', e.target.value)}
                        />
                        <CInput
                            name="userId"
                            label="User ID"
                            value={form.userId}
                            readOnly
                            className="bg-gray-100 cursor-not-allowed text-gray-60"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <LoadingButton type="submit" loading={submitting} className="bg-primary-500 text-white hover:bg-primary-600">
                            {isEdit ? 'Save Changes' : 'Create Partner'}
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

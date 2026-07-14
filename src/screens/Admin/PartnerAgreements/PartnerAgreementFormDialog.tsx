import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
import { matches, required } from '../../../components/form/validators';
import { LoadingButton } from '../../../components/feedback/LoadingButton';
import { useToast } from '../../../components/feedback/Toast';
import { Spinner } from '../../../components/common/Spinner';
import {
    ApiError,
    createPartnerAgreement,
    fetchPlatformPartners,
    fetchServiceLevelAgreements,
    updatePartnerAgreement,
} from '../../../lib/api';
import {
    AgreementStatus,
    AgreementType,
    PartnerAgreementData,
    PlatformPartnerData,
    ServiceLevelAgreementData,
} from '../../../lib/appModels';
import { PartnerAgreementRequest } from '../../../lib/models';
import { buildQueryString } from '../../../lib/utils';

const AGREEMENT_TYPES: AgreementType[] = ['DATA_SHARING', 'VERIFICATION_SERVICE', 'MARKETING', 'LICENSING'];
const AGREEMENT_STATUSES: AgreementStatus[] = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'];
const NO_SLA = 'none';

type FormState = {
    partnerPublicId: string;
    agreementType: AgreementType | '';
    effectiveDate: string;
    expiryDate: string;
    slaPublicId: string;
    signedDocumentUrl: string;
    dataSharingScope: string;
    status: AgreementStatus;
};

type PartnerAgreementFormDialogProps = {
    open: boolean;
    agreement?: PartnerAgreementData | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const emptyForm = (): FormState => ({
    partnerPublicId: '',
    agreementType: '',
    effectiveDate: '',
    expiryDate: '',
    slaPublicId: '',
    signedDocumentUrl: '',
    dataSharingScope: '',
    status: 'DRAFT',
});

const cleanOptional = (value: string) => {
    const trimmed = value.trim();
    return trimmed || undefined;
};

const optional = (validator: (value: string) => string | null) => (value: string) => value ? validator(value) : null;

const toErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
        return error.requestId ? `${error.message} (Request ID: ${error.requestId})` : error.message;
    }
    return 'Request failed';
};

export const PartnerAgreementFormDialog = ({ open, agreement, onOpenChange, onSuccess }: PartnerAgreementFormDialogProps) => {
    const toast = useToast();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [partners, setPartners] = useState<PlatformPartnerData[]>([]);
    const [slas, setSlas] = useState<ServiceLevelAgreementData[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState('');
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isEdit = !!agreement;

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);
        setOptionsError('');
        try {
            const [partnerResp, slaResp] = await Promise.all([
                fetchPlatformPartners(buildQueryString({ page: 0, size: 100, sort: 'partnerName-asc' })),
                fetchServiceLevelAgreements(buildQueryString({ page: 0, size: 100, sort: 'name-asc' })),
            ]);
            setPartners(partnerResp.data.data.data ?? []);
            setSlas(slaResp.data.data.data ?? []);
        } catch (error) {
            setOptionsError(toErrorMessage(error));
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        setServerError('');
        setForm({
            partnerPublicId: agreement?.partnerPublicId ?? '',
            agreementType: agreement?.agreementType ?? '',
            effectiveDate: agreement?.effectiveDate ?? '',
            expiryDate: agreement?.expiryDate ?? '',
            slaPublicId: agreement?.slaPublicId ?? '',
            signedDocumentUrl: agreement?.signedDocumentUrl ?? '',
            dataSharingScope: agreement?.dataSharingScope ?? '',
            status: agreement?.status ?? 'DRAFT',
        });
        loadOptions();
    }, [open, agreement, loadOptions]);

    const clientError = useMemo(() => {
        if (!form.partnerPublicId) return 'Partner is required.';
        if (!form.agreementType) return 'Agreement type is required.';
        if (!form.effectiveDate) return 'Effective date is required.';
        if (form.expiryDate && form.expiryDate <= form.effectiveDate) {
            return 'Expiry date must be after effective date.';
        }
        if (form.signedDocumentUrl && matches(/^https?:\/\/\S+$/i, 'Enter a valid URL starting with http:// or https://')(form.signedDocumentUrl)) {
            return 'Enter a valid signed document URL starting with http:// or https://.';
        }
        return '';
    }, [form]);

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setServerError('');
    };

    const buildPayload = (): PartnerAgreementRequest => ({
        partnerPublicId: form.partnerPublicId,
        agreementType: form.agreementType as AgreementType,
        effectiveDate: form.effectiveDate,
        expiryDate: cleanOptional(form.expiryDate),
        slaPublicId: cleanOptional(form.slaPublicId),
        signedDocumentUrl: cleanOptional(form.signedDocumentUrl),
        dataSharingScope: cleanOptional(form.dataSharingScope),
        status: form.status,
    });

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (clientError) {
            setServerError(clientError);
            return;
        }
        if (optionsError) {
            setServerError('Partner and SLA options must load before saving.');
            return;
        }

        setSubmitting(true);
        setServerError('');
        try {
            if (isEdit && agreement?.publicId) {
                await updatePartnerAgreement(agreement.publicId, buildPayload());
            } else {
                await createPartnerAgreement(buildPayload());
            }
            toast.show({
                type: 'success',
                title: isEdit ? 'Agreement updated' : 'Agreement created',
                message: isEdit ? 'The partner agreement was updated.' : 'The partner agreement was created.',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const message = toErrorMessage(error);
            setServerError(message);
            toast.show({ type: 'error', title: 'Agreement request failed', message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
            <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Partner Agreement' : 'Add Partner Agreement'}</DialogTitle>
                        <DialogDescription>
                            Select a partner and optional SLA from existing records.
                        </DialogDescription>
                    </DialogHeader>

                    {optionsLoading && (
                        <div className="flex items-center justify-center rounded-lg border border-gray-20 p-6">
                            <Spinner label="Loading partners and SLAs..." />
                        </div>
                    )}

                    {optionsError && (
                        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <p>{optionsError}</p>
                            <Button type="button" variant="outline" onClick={loadOptions}>Retry options</Button>
                        </div>
                    )}

                    {serverError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Partner</label>
                            <Select
                                value={form.partnerPublicId || undefined}
                                disabled={optionsLoading || !!optionsError}
                                onValueChange={(value) => updateField('partnerPublicId', value)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select partner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {partners.map((partner) => (
                                        <SelectItem key={partner.publicId} value={partner.publicId}>
                                            {partner.partnerName} ({partner.partnerCode})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Agreement Type</label>
                            <Select value={form.agreementType || undefined} onValueChange={(value) => updateField('agreementType', value as AgreementType)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGREEMENT_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>{type.replaceAll('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <CInput
                            name="effectiveDate"
                            label="Effective Date"
                            type="date"
                            value={form.effectiveDate}
                            required
                            validate={required()}
                            onChange={(e) => updateField('effectiveDate', e.target.value)}
                        />
                        <CInput
                            name="expiryDate"
                            label="Expiry Date"
                            type="date"
                            value={form.expiryDate}
                            onChange={(e) => updateField('expiryDate', e.target.value)}
                        />
                        <div>
                            <label className="mb-1 block text-sm font-medium">SLA</label>
                            <Select
                                value={form.slaPublicId || NO_SLA}
                                disabled={optionsLoading || !!optionsError}
                                onValueChange={(value) => updateField('slaPublicId', value === NO_SLA ? '' : value)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select SLA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_SLA}>No SLA</SelectItem>
                                    {slas.map((sla) => (
                                        <SelectItem key={sla.publicId} value={sla.publicId}>{sla.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Status</label>
                            <Select value={form.status} onValueChange={(value) => updateField('status', value as AgreementStatus)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AGREEMENT_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <CInput
                            name="signedDocumentUrl"
                            label="Signed Document URL"
                            type="url"
                            value={form.signedDocumentUrl}
                            validate={optional(matches(/^https?:\/\/\S+$/i, 'Enter a valid URL starting with http:// or https://'))}
                            onChange={(e) => updateField('signedDocumentUrl', e.target.value)}
                        />
                        <CInput
                            name="dataSharingScope"
                            label="Data Sharing Scope"
                            value={form.dataSharingScope}
                            onChange={(e) => updateField('dataSharingScope', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            loading={submitting}
                            disabled={optionsLoading || !!optionsError}
                            className="bg-primary-500 text-white hover:bg-primary-600"
                        >
                            {isEdit ? 'Save Changes' : 'Create Agreement'}
                        </LoadingButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

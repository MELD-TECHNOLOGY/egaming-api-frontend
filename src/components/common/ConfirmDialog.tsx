import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { LoadingButton } from '../feedback/LoadingButton';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void | Promise<void>;
};

export const ConfirmDialog = ({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    onOpenChange,
    onConfirm,
}: ConfirmDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelLabel}
                    </Button>
                    <LoadingButton
                        type="button"
                        loading={loading}
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClickAsync={async () => {
                            await onConfirm();
                        }}
                    >
                        {confirmLabel}
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

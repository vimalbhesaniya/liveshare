import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DraftRecoveryDialogProps = {
  open: boolean;
  draftSavedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
};

export function DraftRecoveryDialog({
  open,
  draftSavedAt,
  onRestore,
  onDiscard,
}: DraftRecoveryDialogProps) {
  const { t } = useTranslation();
  const when = new Date(draftSavedAt).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editor.draftRecoveryTitle")}</DialogTitle>
          <DialogDescription>
            {t("editor.draftRecoveryDesc", { when })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDiscard}>
            {t("editor.draftDiscard")}
          </Button>
          <Button onClick={onRestore}>{t("editor.draftRestore")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

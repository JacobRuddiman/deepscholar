'use client';

import { useState } from 'react';
import {
  useRequestAccountDeletion,
  useCancelAccountDeletion,
  useDeletionRequestStatus,
} from '@/hooks/mutations/useGDPRMutations';
import { Trash2, AlertTriangle, Loader2, Info, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, formatDistanceToNow } from 'date-fns';

export function AccountDeletionCard() {
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: status, isLoading } = useDeletionRequestStatus();
  const requestDeletion = useRequestAccountDeletion();
  const cancelDeletion = useCancelAccountDeletion();

  const handleRequestDeletion = async () => {
    await requestDeletion.mutateAsync(reason);
    setDialogOpen(false);
    setReason('');
  };

  const handleCancelDeletion = async () => {
    await cancelDeletion.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasPendingDeletion = status?.hasPendingDeletion;
  const deletionRequest = status?.request;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data (GDPR Article 17)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pending Deletion Alert */}
        {hasPendingDeletion && deletionRequest && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Deletion Pending</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                Your account is scheduled for deletion. Requested{' '}
                {formatDistanceToNow(new Date(deletionRequest.requestedAt), {
                  addSuffix: true,
                })}.
              </p>
              {deletionRequest.publishedBriefsCount > 0 && (
                <p className="text-sm">
                  You have {deletionRequest.publishedBriefsCount} published brief(s).
                  Your briefs will be anonymized but remain accessible.
                </p>
              )}
              <Button
                onClick={handleCancelDeletion}
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={cancelDeletion.isPending}
              >
                {cancelDeletion.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Deletion Request
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Alert */}
        {!hasPendingDeletion && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: This action cannot be undone</AlertTitle>
              <AlertDescription className="mt-2">
                Deleting your account will permanently remove:
                <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                  <li>Your profile and personal information</li>
                  <li>All draft briefs</li>
                  <li>All reviews and comments</li>
                  <li>Your upvotes and follows</li>
                  <li>Reputation points and badges</li>
                  <li>All notifications and preferences</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Info about published briefs */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Published briefs:</strong> Will be anonymized (author removed)
                but remain accessible to preserve community knowledge. If you have
                published briefs, there will be a 30-day grace period before deletion.
              </AlertDescription>
            </Alert>

            {/* Delete Button with Confirmation Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Account Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Reason for deletion (optional)
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Help us improve by telling us why you're leaving..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      After submitting this request, you will have a grace period to
                      change your mind. After this period, your account will be
                      permanently deleted.
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={requestDeletion.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRequestDeletion}
                    disabled={requestDeletion.isPending}
                  >
                    {requestDeletion.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Confirm Deletion'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Additional Information */}
        <p className="text-xs text-muted-foreground">
          For more information about data deletion and your rights, see our{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}

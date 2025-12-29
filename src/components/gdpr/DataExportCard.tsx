'use client';

import { useState } from 'react';
import { useExportUserData, useDownloadUserData } from '@/hooks/mutations/useGDPRMutations';
import { Download, FileJson, Loader2, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DataExportCard() {
  const [exportedData, setExportedData] = useState<any>(null);
  const exportData = useExportUserData();
  const downloadData = useDownloadUserData();

  const handleExport = async () => {
    const data = await exportData.mutateAsync();
    setExportedData(data);
  };

  const handleDownload = () => {
    downloadData.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a copy of all your personal data stored in DeepScholar (GDPR Article 15)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <FileJson className="h-4 w-4" />
          <AlertDescription>
            Your data export will include: profile information, briefs, reviews, upvotes,
            follows, notifications, reputation, badges, and activity history.
          </AlertDescription>
        </Alert>

        {/* Export Button */}
        {!exportedData ? (
          <Button
            onClick={handleExport}
            disabled={exportData.isPending}
            className="w-full"
          >
            {exportData.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Prepare Data Export
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            {/* Success Message */}
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Data export prepared successfully</span>
            </div>

            {/* Export Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <p className="font-semibold">Export Summary:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {exportedData.briefs?.count || 0} briefs</li>
                <li>• {exportedData.reviews?.count || 0} reviews</li>
                <li>• {exportedData.upvotes?.count || 0} upvotes</li>
                <li>• {exportedData.social?.following?.count || 0} following</li>
                <li>• {exportedData.social?.followers?.count || 0} followers</li>
                <li>• {exportedData.reputation?.badges?.count || 0} badges</li>
                <li>• {exportedData.notifications?.count || 0} notifications</li>
              </ul>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={downloadData.isPending}
              className="w-full"
              variant="default"
            >
              {downloadData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Download JSON File
                </>
              )}
            </Button>

            {/* Prepare New Export */}
            <Button
              onClick={handleExport}
              disabled={exportData.isPending}
              variant="outline"
              className="w-full"
            >
              Prepare New Export
            </Button>
          </div>
        )}

        {/* Additional Info */}
        <p className="text-xs text-muted-foreground">
          The export will be provided in JSON format. This data is a complete snapshot
          of your information at the time of export.
        </p>
      </CardContent>
    </Card>
  );
}

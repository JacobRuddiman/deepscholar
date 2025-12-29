'use client';

import { useState } from 'react';
import { useSpamReports } from '@/hooks/mutations/useSpamDetection';
import { Loader2, AlertTriangle, Flag, EyeOff, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

const ACTION_CONFIG = {
  flag: {
    label: 'Flagged',
    icon: Flag,
    variant: 'secondary' as const,
    color: 'text-yellow-600',
  },
  hide: {
    label: 'Hidden',
    icon: EyeOff,
    variant: 'warning' as const,
    color: 'text-orange-600',
  },
  ban: {
    label: 'Banned',
    icon: Ban,
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
};

export function SpamReportsTable() {
  const [action, setAction] = useState<'flag' | 'hide' | 'ban' | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading } = useSpamReports({ limit, offset, action });

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (data?.hasMore) {
      setOffset(offset + limit);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (score >= 60) {
      return <Badge variant="warning">High</Badge>;
    } else if (score >= 30) {
      return <Badge variant="secondary">Medium</Badge>;
    }
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Spam Detection Reports
        </CardTitle>
        <CardDescription>
          Review and manage spam detection incidents
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filter Tabs */}
        <Tabs value={action || 'all'} onValueChange={(v) => {
          setAction(v === 'all' ? undefined : v as any);
          setOffset(0);
        }}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="flag">Flagged</TabsTrigger>
            <TabsTrigger value="hide">Hidden</TabsTrigger>
            <TabsTrigger value="ban">Banned</TabsTrigger>
          </TabsList>

          <TabsContent value={action || 'all'} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !data || data.reports.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No spam reports found</p>
              </div>
            ) : (
              <>
                {/* Reports Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Reasons</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.reports.map((report) => {
                        const actionConfig = ACTION_CONFIG[report.action as keyof typeof ACTION_CONFIG];
                        const ActionIcon = actionConfig?.icon || Flag;

                        return (
                          <TableRow key={report.id}>
                            {/* User */}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {report.user.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {report.user.email}
                                </span>
                              </div>
                            </TableCell>

                            {/* Content Type */}
                            <TableCell>
                              <Badge variant="outline">
                                {report.contentType}
                              </Badge>
                            </TableCell>

                            {/* Content Preview */}
                            <TableCell className="max-w-xs">
                              <p className="text-sm truncate">
                                {report.content}
                              </p>
                            </TableCell>

                            {/* Spam Score */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getScoreBadge(report.spamScore)}
                                <span className="text-sm text-muted-foreground">
                                  {report.spamScore}
                                </span>
                              </div>
                            </TableCell>

                            {/* Action */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ActionIcon className={`h-4 w-4 ${actionConfig?.color}`} />
                                <span className="text-sm">
                                  {actionConfig?.label || report.action}
                                </span>
                              </div>
                            </TableCell>

                            {/* Reasons */}
                            <TableCell className="max-w-xs">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {report.reasons}
                              </p>
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(report.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={offset === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Showing {offset + 1} - {offset + data.reports.length} of {data.total}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!data.hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

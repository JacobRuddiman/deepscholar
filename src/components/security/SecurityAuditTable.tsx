'use client';

import { useState } from 'react';
import { useSecurityAuditLogs, SECURITY_EVENTS } from '@/hooks/mutations/useSecurityAudit';
import { Loader2, Shield, AlertTriangle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { EmptyStates } from '@/components/empty-states/EmptyState';

const SEVERITY_CONFIG = {
  info: {
    label: 'Info',
    icon: Info,
    variant: 'outline' as const,
    color: 'text-blue-600',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    variant: 'warning' as const,
    color: 'text-yellow-600',
  },
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
};

export function SecurityAuditTable({ userId }: { userId?: string }) {
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical' | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading } = useSecurityAuditLogs({ userId, severity, limit, offset });

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (data?.hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
        </CardTitle>
        <CardDescription>
          Track security events and authentication activity
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filter Tabs */}
        <Tabs value={severity || 'all'} onValueChange={(v: string) => {
          setSeverity(v === 'all' ? undefined : v as 'info' | 'warning' | 'critical');
          setOffset(0);
        }}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <TabsContent value={severity || 'all'} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !data || data.logs.length === 0 ? (
              <EmptyStates.NoSecurityEvents />
            ) : (
              <>
                {/* Events Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.logs.map((log: { id: string; severity: string; event: string; action?: string; details?: string; ipAddress?: string; createdAt: string; user?: { name: string | null; email: string | null } }) => {
                        const severityConfig = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG];
                        const SeverityIcon = severityConfig?.icon || Info;

                        return (
                          <TableRow key={log.id}>
                            {/* Event */}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {log.event.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                                {log.user && (
                                  <span className="text-xs text-muted-foreground">
                                    {log.user.name || log.user.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Action */}
                            <TableCell>
                              <Badge
                                variant={
                                  log.action === 'success' ? 'default' :
                                  log.action === 'failure' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {log.action}
                              </Badge>
                            </TableCell>

                            {/* Severity */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <SeverityIcon className={`h-4 w-4 ${severityConfig?.color}`} />
                                <span className="text-sm">
                                  {severityConfig?.label}
                                </span>
                              </div>
                            </TableCell>

                            {/* IP Address */}
                            <TableCell>
                              <span className="text-sm font-mono">
                                {log.ipAddress || 'N/A'}
                              </span>
                            </TableCell>

                            {/* Details */}
                            <TableCell className="max-w-xs">
                              {log.details && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {JSON.stringify(JSON.parse(log.details), null, 2)}
                                </p>
                              )}
                            </TableCell>

                            {/* Time */}
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), {
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
                    Showing {offset + 1} - {offset + data.logs.length} of {data.total}
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

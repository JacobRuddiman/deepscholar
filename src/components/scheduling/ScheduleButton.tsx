'use client';

import { useState } from 'react';
import { useScheduleBrief, useCancelScheduled } from '@/hooks/mutations/useScheduling';
import { Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ScheduleButtonProps {
  briefId: string;
  currentSchedule?: Date | null;
}

export function ScheduleButton({ briefId, currentSchedule }: ScheduleButtonProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const scheduleBrief = useScheduleBrief();
  const cancelScheduled = useCancelScheduled();

  const handleSchedule = async () => {
    const scheduledFor = new Date(`${date}T${time}`);
    await scheduleBrief.mutateAsync({ briefId, scheduledFor });
    setOpen(false);
  };

  const handleCancel = async () => {
    await cancelScheduled.mutateAsync(briefId);
  };

  if (currentSchedule) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4" />
        <span>Scheduled: {new Date(currentSchedule).toLocaleString()}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={cancelScheduled.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Publication</DialogTitle>
          <DialogDescription>
            Choose when this brief should be published
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSchedule}
            disabled={!date || !time || scheduleBrief.isPending}
          >
            {scheduleBrief.isPending ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

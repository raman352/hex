import { AlertCircle, CheckCircle2, Clock, Flame, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { TicketPriority, TicketStatus } from '../types';

export function StatusLabel({ status }: { status: TicketStatus }) {
  switch (status) {
    case TicketStatus.OPEN:
      return (
        <span className="neu-status-open inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Open</span>
        </span>
      );
    case TicketStatus.IN_PROGRESS:
      return (
        <span className="neu-status-progress inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case TicketStatus.RESOLVED:
      return (
        <span className="neu-status-resolved inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
  }
}

export function PriorityLabel({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case TicketPriority.URGENT:
      return (
        <span className="neu-status-error inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Urgent</span>
        </span>
      );
    case TicketPriority.HIGH:
      return (
        <span className="neu-status-progress inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <ArrowUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case TicketPriority.MEDIUM:
      return (
        <span className="neu-status-open inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
          <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Medium</span>
        </span>
      );
    case TicketPriority.LOW:
      return (
        <span className="neu-inset-sm inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5B6C82] whitespace-nowrap">
          <ArrowDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Low</span>
        </span>
      );
  }
}

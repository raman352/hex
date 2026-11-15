import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Flame,
  Minus,
} from 'lucide-react';
import { TicketPriority, TicketStatus } from '../types';

export function StatusLabel({ status }: { status: TicketStatus }) {
  switch (status) {
    case TicketStatus.OPEN:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EEF3FE] text-[#3B6FD4] border border-[#DCE6FB] whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#5486EA]" aria-hidden="true" />
          <span>Open</span>
        </span>
      );
    case TicketStatus.IN_PROGRESS:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FFF6EB] text-[#B86F14] border border-[#FBE5C8] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#F4AE54]" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );
    case TicketStatus.RESOLVED:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EAF9F3] text-[#17875E] border border-[#CBEFE0] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#22B983]" aria-hidden="true" />
          <span>Resolved</span>
        </span>
      );
  }
}

export function PriorityLabel({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case TicketPriority.URGENT:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FDEEEF] text-[#C8434D] border border-[#FAD5D8] whitespace-nowrap">
          <Flame className="w-3.5 h-3.5 shrink-0 text-[#EF747C]" aria-hidden="true" />
          <span>Urgent</span>
        </span>
      );
    case TicketPriority.HIGH:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FFF6EB] text-[#B86F14] border border-[#FBE5C8] whitespace-nowrap">
          <ArrowUp className="w-3.5 h-3.5 shrink-0 text-[#F4AE54]" aria-hidden="true" />
          <span>High</span>
        </span>
      );
    case TicketPriority.MEDIUM:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F2EEFD] text-[#694EC9] border border-[#E2DAFB] whitespace-nowrap">
          <Minus className="w-3.5 h-3.5 shrink-0 text-[#8B72E8]" aria-hidden="true" />
          <span>Medium</span>
        </span>
      );
    case TicketPriority.LOW:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F4F6FC] text-[#5E6B85] border border-[#E2E8F5] whitespace-nowrap">
          <ArrowDown className="w-3.5 h-3.5 shrink-0 text-[#78849B]" aria-hidden="true" />
          <span>Low</span>
        </span>
      );
  }
}

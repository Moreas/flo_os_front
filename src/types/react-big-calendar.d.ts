declare module 'react-big-calendar' {
  import { ComponentType, ReactNode } from 'react';

  export type View = 'day' | 'week' | 'month' | 'agenda';
  
  export interface CalendarProps {
    localizer: any;
    events: any[];
    startAccessor: string;
    endAccessor: string;
    view?: View;
    onView?: (view: View) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
    onSelectEvent?: (event: any) => void;
    selectable?: boolean;
    style?: React.CSSProperties;
    components?: {
      event?: ComponentType<{ event: any }>;
      [key: string]: any;
    };
    min?: Date;
    date?: Date;
    onNavigate?: (date: Date, view: View, action: string) => void;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export const dateFnsLocalizer: (config: any) => any;
} 
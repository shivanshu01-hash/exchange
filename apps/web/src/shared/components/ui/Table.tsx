"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TableProps extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'border'> {
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  border?: boolean;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = true, hover = true, compact = false, border = true, ...props }, ref) => {
    return (
      <div className={cn("overflow-x-auto", border && "rounded-lg border border-slate-200")}>
        <table
          ref={ref}
          className={cn(
            "w-full text-sm",
            striped && "divide-y divide-slate-200",
            compact ? "text-xs" : "text-sm",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Table.displayName = "Table";

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("bg-slate-50", className)}
        {...props}
      />
    );
  }
);

TableHeader.displayName = "TableHeader";

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  hover?: boolean;
}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, hover = true, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn(
          "divide-y divide-slate-200 bg-white",
          hover && "[&_tr:hover]:bg-slate-50",
          className
        )}
        {...props}
      />
    );
  }
);

TableBody.displayName = "TableBody";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  highlight?: "back" | "lay" | "success" | "warning" | "danger" | "info";
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, highlight, ...props }, ref) => {
    const highlightStyles = {
      back: "bg-back/5 hover:bg-back/10",
      lay: "bg-lay/5 hover:bg-lay/10",
      success: "bg-emerald-50 hover:bg-emerald-100",
      warning: "bg-amber-50 hover:bg-amber-100",
      danger: "bg-red-50 hover:bg-red-100",
      info: "bg-blue-50 hover:bg-blue-100",
    };

    return (
      <tr
        ref={ref}
        className={cn(
          "transition-colors duration-150",
          highlight && highlightStyles[highlight],
          className
        )}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | "none";
  onSort?: () => void;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider",
          sortable && "cursor-pointer select-none hover:bg-slate-100",
          className
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="flex items-center justify-between">
          {children}
          {sortable && sortDirection && sortDirection !== "none" && (
            <span className="ml-2">
              {sortDirection === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  numeric?: boolean;
}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", numeric = false, ...props }, ref) => {
    const alignStyles = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    };

    return (
      <td
        ref={ref}
        className={cn(
          "px-4 py-3",
          alignStyles[align],
          numeric && "font-mono tabular-nums",
          className
        )}
        {...props}
      />
    );
  }
);

TableCell.displayName = "TableCell";

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn("bg-slate-50 font-semibold", className)}
        {...props}
      />
    );
  }
);

TableFooter.displayName = "TableFooter";

// Specialized table components for trading
export interface OrdersTableProps {
  orders: Array<{
    id: string;
    marketId: string;
    selectionId: string;
    side: "BACK" | "LAY";
    price: number;
    stake: number;
    matched: number;
    status: "open" | "matched" | "cancelled";
    createdAt: string;
  }>;
  onCancel?: (orderId: string) => void;
}

export function OrdersTable({ orders, onCancel }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Market</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stake</TableHead>
          <TableHead>Matched</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} highlight={order.side === "BACK" ? "back" : "lay"}>
            <TableCell>{order.marketId}</TableCell>
            <TableCell>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                order.side === "BACK" ? "bg-back/10 text-back" : "bg-lay/10 text-lay"
              )}>
                {order.side}
              </span>
            </TableCell>
            <TableCell numeric>{order.price.toFixed(2)}</TableCell>
            <TableCell numeric>₹{order.stake.toFixed(2)}</TableCell>
            <TableCell numeric>₹{order.matched.toFixed(2)}</TableCell>
            <TableCell>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                order.status === "open" && "bg-blue-100 text-blue-800",
                order.status === "matched" && "bg-emerald-100 text-emerald-800",
                order.status === "cancelled" && "bg-slate-100 text-slate-800"
              )}>
                {order.status}
              </span>
            </TableCell>
            <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
            <TableCell>
              {order.status === "open" && onCancel && (
                <button
                  onClick={() => onCancel(order.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Cancel
                </button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
};
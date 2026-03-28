import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  onClick?: () => void;
};

export default function Table({ children, className }: Props) {
  return (
    <table className={`min-w-full bg-white border-collapse rounded-md ${className}`}>{children}</table>
  );
}

Table.Head = function TableHead({ children }: Props) {
  return (
    <thead className="sticky top-0 border-b border-[#F1F5F9] z-10 text-[#64748B] bg-[#F1F5F9] ">
      {children}
    </thead>
  );
};

Table.Row = function TableRow({ children, onClick, className}: Props) {
  return (
    <tr className={`border-b border-[#00000014] ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
};

Table.Cell = function TableCell({ children,className }: Props) {
  return (
    <td className={`px-4 py-2 ${className}`}>
      {children}
    </td>
  );
};

Table.Th = function TableTh({ children }: Props) {
  return (
    <th className="text-left px-4 py-2 text-[#8B95A6]">
      {children}
    </th>
  );
};

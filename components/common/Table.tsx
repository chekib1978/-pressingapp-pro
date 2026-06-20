import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
}

const Table = <T extends { id: string | number },>(
  { columns, data, onRowClick, isLoading = false, emptyStateMessage = "Aucune donnée disponible." }: TableProps<T>
): React.ReactNode => {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-xl">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider md:px-6 ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500 md:px-6">
                Chargement...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500 md:px-6">
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick && onRowClick(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100' : ''} transition-colors duration-150`}
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`px-4 py-4 whitespace-nowrap align-middle text-sm text-slate-700 md:px-6 md:py-5 md:text-base ${col.className || ''}`}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : String(item[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

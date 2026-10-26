import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Product, ProductStatus } from '../../types/product'

interface ProductTableProps {
  products: Product[]
  canManage: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

const statusClasses: Record<ProductStatus, string> = {
  active:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  archived:
    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

const columnHelper = createColumnHelper<Product>()

export function ProductTable({
  products,
  canManage,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Product',
        cell: ({ row, getValue }) => (
          <div className="flex min-w-48 items-center gap-3">
            {row.original.images[0] ? (
              <img
                src={row.original.images[0]}
                alt=""
                className="size-10 rounded-lg object-cover"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400 dark:bg-slate-800">
                {getValue().slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('sku', {
        header: 'SKU',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          <span className="capitalize">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: (info) => `$${info.getValue().toFixed(2)}`,
      }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: (info) => (
          <span
            className={
              info.getValue() <= 5
                ? 'font-semibold text-red-600 dark:text-red-400'
                : ''
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[info.getValue()]}`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      ...(canManage
        ? [
            columnHelper.display({
              id: 'actions',
              header: 'Actions',
              enableSorting: false,
              cell: ({ row }) => (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${row.original.name}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                    onClick={() => onEdit(row.original)}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${row.original.name}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    onClick={() => onDelete(row.original)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ),
            }),
          ]
        : []),
    ],
    [canManage, onDelete, onEdit],
  )

  // TanStack exposes table methods that React Compiler must not memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="size-3.5" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="size-3.5" />
                        ) : null}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No products match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing{' '}
          {table.getRowModel().rows.length === 0
            ? 0
            : table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1}{' '}
          to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            products.length,
          )}{' '}
          of {products.length} products
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="product-page-size">Rows</label>
          <select
            id="product-page-size"
            value={table.getState().pagination.pageSize}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40 dark:border-slate-700"
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}

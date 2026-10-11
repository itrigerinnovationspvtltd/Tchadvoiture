import { Skeleton, TableCell, TableRow } from '@/components/ui'

const CELL_MAX = ['max-w-[12rem]', 'max-w-[8rem]', 'max-w-[14rem]', 'max-w-[10rem]', 'max-w-[6rem]', 'max-w-[9rem]']

export function TableSkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className={`h-4 w-full ${CELL_MAX[colIndex % CELL_MAX.length]}`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

'use client';
import { useState, useMemo, useTransition } from 'react';
import type { GdpRecord } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { updateGdpRecord, deleteGdpRecord } from '@/lib/actions';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowUpDown,
  Pencil,
  Trash2,
  Save,
  X,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SortConfig = {
  key: keyof Omit<GdpRecord, 'id'>;
  direction: 'ascending' | 'descending';
};

const ITEMS_PER_PAGE = 10;

export function GdpDataTable({ data }: { data: GdpRecord[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'year', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);
  
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof Omit<GdpRecord, 'id'>) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleEdit = (record: GdpRecord) => {
    setEditingRowId(record.id);
    setEditValue(record.value);
  };

  const handleCancel = () => {
    setEditingRowId(null);
  };

  const handleSave = (id: string) => {
    if (editValue <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Value', description: 'GDP value must be positive.' });
      return;
    }
    startTransition(async () => {
      const result = await updateGdpRecord(id, editValue);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
      } else {
        toast({ title: 'Success', description: 'Record updated successfully.' });
        setEditingRowId(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteGdpRecord(id);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
      } else {
        toast({ title: 'Success', description: 'Record deleted successfully.' });
      }
    });
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('year')}>
                  Year
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('value')}>
                  GDP (Billions)
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('country')}>
                  Country
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.year}</TableCell>
                <TableCell>
                  {editingRowId === record.id ? (
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className="max-w-xs"
                      autoFocus
                    />
                  ) : (
                    `$${record.value.toLocaleString()}`
                  )}
                </TableCell>
                <TableCell>{record.country}</TableCell>
                <TableCell className="text-right">
                  {editingRowId === record.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleSave(record.id)} disabled={isPending}>
                        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600" />}
                        <span className="sr-only">Save</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isPending}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                             <Trash2 className="h-4 w-4 text-destructive" />
                             <span className="sr-only">Delete</span>
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the GDP record for the year {record.year}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive hover:bg-destructive/90">
                              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
             {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No records found. Add a new record to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
           <span className="sr-only">Next</span>
        </Button>
      </div>
    </>
  );
}

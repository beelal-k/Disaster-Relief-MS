'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Eye, CheckCircle2, XCircle, Clock, AlertTriangle, MoreVertical, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Dispatch {
    _id: string;
    need: {
        _id: string;
        type: string;
        description: string;
        location: {
            lat: number;
            lng: number;
        };
        requiredQuantity: number;
        createdBy: {
            email: string;
        };
    };
    dispatchedAt: string;
    eta: number;
    status: 'dispatched' | 'reached' | 'cancelled';
    resourceAmount: number;
}

interface DispatchesTableProps {
    dispatches: Dispatch[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
}

export default function DispatchesTable({ dispatches, onUpdate, onDelete }: DispatchesTableProps) {
    const { toast } = useToast();
    const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const handleStatusUpdate = async (dispatchId: string, newStatus: 'reached' | 'cancelled') => {
        setIsUpdating(true);
        try {
            await api.patch(`/dispatches/${dispatchId}`, { status: newStatus });
            toast({
                title: 'Success',
                description: `Dispatch ${newStatus} successfully.`,
            });
            onUpdate();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update dispatch status.',
                variant: 'destructive',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleViewDetails = (dispatch: Dispatch) => {
        setSelectedDispatch(dispatch);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'dispatched':
                return <Badge variant="secondary" className="flex w-fit items-center gap-1">
                    <Clock className="w-3 h-3" /> In Transit
                </Badge>;
            case 'reached':
                return <Badge variant="default" className="flex w-fit items-center gap-1 bg-green-600">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                </Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="flex w-fit items-center gap-1">
                    <XCircle className="w-3 h-3" /> Cancelled
                </Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const calculateTimeLeft = (dispatchedAt: string, etaMinutes: number) => {
        const dispatchTime = new Date(dispatchedAt).getTime();
        const estimatedArrival = dispatchTime + (etaMinutes * 60 * 1000);
        const now = new Date().getTime();
        const timeLeft = estimatedArrival - now;

        if (timeLeft <= 0) return 'Overdue';

        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        const hoursLeft = Math.floor(minutesLeft / 60);

        if (hoursLeft > 0) {
            return `${hoursLeft}h ${minutesLeft % 60}m`;
        }
        return `${minutesLeft}m`;
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Dispatched At</TableHead>
                        <TableHead>ETA</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dispatches.map((dispatch) => (
                        <TableRow key={dispatch._id}>
                            <TableCell className="font-medium">{dispatch.need.type}</TableCell>
                            <TableCell>
                                {dispatch.need.location.lat.toFixed(6)}, {dispatch.need.location.lng.toFixed(6)}
                            </TableCell>
                            <TableCell>{dispatch.resourceAmount}</TableCell>
                            <TableCell>
                                {new Date(dispatch.dispatchedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {dispatch.status === 'dispatched' ? (
                                    <span className="flex items-center gap-2">
                                        {calculateTimeLeft(dispatch.dispatchedAt, dispatch.eta)}
                                        {calculateTimeLeft(dispatch.dispatchedAt, dispatch.eta) === 'Overdue' && (
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                        )}
                                    </span>
                                ) : (
                                    `${dispatch.eta} minutes`
                                )}
                            </TableCell>
                            <TableCell>{getStatusBadge(dispatch.status)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="hover:bg-neutral-800">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-neutral-900 text-white border-neutral-800 z-[1001]"
                                        sideOffset={5}
                                    >
                                        <DropdownMenuItem
                                            className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white"
                                            onClick={() => handleViewDetails(dispatch)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        {dispatch.status === 'dispatched' && (
                                            <>
                                                <DropdownMenuItem
                                                    className="cursor-pointer hover:bg-neutral-800 text-green-500 focus:bg-neutral-800 focus:text-green-500"
                                                    onClick={() => handleStatusUpdate(dispatch._id, 'reached')}
                                                    disabled={isUpdating}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Reached
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer hover:bg-neutral-800 text-red-500 focus:bg-neutral-800 focus:text-red-500"
                                                    onClick={() => handleStatusUpdate(dispatch._id, 'cancelled')}
                                                    disabled={isUpdating}
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" /> Cancel Dispatch
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Dispatch Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-neutral-900 text-white border-neutral-800 z-[9999] max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">Dispatch Details</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                View detailed information about this dispatch
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    {selectedDispatch && (
                        <div className="space-y-6 text-white">
                            <Card className="bg-neutral-800 border-neutral-700 text-white p-4">
                                <h3 className="text-lg font-semibold mb-4">Status Timeline</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Dispatched</p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(selectedDispatch.dispatchedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedDispatch.status === 'reached' ? 'bg-green-500' :
                                            selectedDispatch.status === 'cancelled' ? 'bg-red-500' :
                                                'bg-gray-700'
                                            }`}>
                                            {selectedDispatch.status === 'reached' ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : selectedDispatch.status === 'cancelled' ? (
                                                <XCircle className="w-4 h-4" />
                                            ) : (
                                                <Clock className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {selectedDispatch.status === 'reached' ? 'Reached' :
                                                    selectedDispatch.status === 'cancelled' ? 'Cancelled' :
                                                        'Expected Arrival'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {selectedDispatch.status === 'dispatched' ? (
                                                    calculateTimeLeft(selectedDispatch.dispatchedAt, selectedDispatch.eta)
                                                ) : (
                                                    'Completed'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-neutral-800 border-neutral-700 text-white p-4">
                                <h3 className="text-lg font-semibold mb-4">Need Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-400">Type</p>
                                        <p className="font-medium">{selectedDispatch.need.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Description</p>
                                        <p className="font-medium">{selectedDispatch.need.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Requested By</p>
                                        <p className="font-medium">{selectedDispatch.need.createdBy.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Resource Amount</p>
                                        <p className="font-medium">{selectedDispatch.resourceAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Location</p>
                                        <p className="font-medium">
                                            {selectedDispatch.need.location.lat.toFixed(6)}, {selectedDispatch.need.location.lng.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
} 
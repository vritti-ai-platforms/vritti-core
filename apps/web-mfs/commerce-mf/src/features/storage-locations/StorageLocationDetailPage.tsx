import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Pencil } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteLocation, useLocation, useLocationLevels } from '@/hooks/storage-locations';
import type { LocationStockData } from '@/schemas/storage-locations';
import { EditLocationDialog } from './forms/EditLocationDialog';

export const StorageLocationDetailPage = () => {
	const { id } = useSlugParams('locationSlug');
	const navigate = useNavigate();
	const { data: location, isLoading } = useLocation(id ?? null);
	const { data: levels = [] } = useLocationLevels(id ?? null);
	const editDialog = useDialog();
	const confirm = useConfirm();
	const deleteMutation = useDeleteLocation();

	const handleDelete = async () => {
		if (!location) return;
		const confirmed = await confirm({
			title: `Delete "${location.name}"?`,
			description: 'This storage location and all associated stock levels will be permanently removed.',
			confirmLabel: 'Delete',
			variant: 'destructive',
		});
		if (confirmed) deleteMutation.mutate(location.id, { onSuccess: () => navigate('..') });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spinner />
			</div>
		);
	}

	if (!location) {
		return (
			<div className="flex items-center justify-center py-20 text-muted-foreground">Location not found.</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={location.name}
				description={location.code}
				actions={
					<Button variant="outline" size="sm" startAdornment={<Pencil className="size-4" />} onClick={editDialog.open}>
						Edit
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-6">
						<div>
							<p className="text-sm text-muted-foreground">Code</p>
							<p className="mt-1 font-mono font-medium">{location.code}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Area</p>
							<p className="mt-1">{location.area ?? '—'}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Manager ID</p>
							<p className="mt-1 font-mono">{location.managerId ?? '—'}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Status</p>
							<Badge variant={location.isActive ? 'secondary' : 'outline'} className="mt-1">
								{location.isActive ? 'Active' : 'Inactive'}
							</Badge>
						</div>
						<div className="col-span-2">
							<p className="text-sm text-muted-foreground">Address</p>
							<p className="mt-1">{location.address ?? '—'}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Created</p>
							<p className="mt-1">{new Date(location.createdAt).toLocaleDateString()}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<StockLevelsCard levels={levels} />

			<DangerZone
				title="Delete this storage location"
				description="This action cannot be undone. All stock levels at this location will be permanently removed."
				buttonText="Delete Location"
				onClick={handleDelete}
				disabled={!location.canDelete}
				warning={
					!location.canDelete
						? 'This location has stock levels or is referenced by transfers and cannot be deleted.'
						: undefined
				}
			/>

			<Dialog
				handle={editDialog}
				title="Edit Location"
				description="Update the storage location details."
				content={(close) => <EditLocationDialog location={location} onSuccess={close} onCancel={close} />}
			/>
		</div>
	);
};

const StockLevelsCard: React.FC<{ levels: LocationStockData[] }> = ({ levels }) => {
	if (levels.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					No stock levels at this location yet. Stock is updated when goods are received or transferred.
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Stock Levels</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pb-2 font-medium">Item Code</th>
								<th className="pb-2 font-medium">Item Name</th>
								<th className="pb-2 font-medium text-right">Stocked</th>
								<th className="pb-2 font-medium text-right">Reserved</th>
								<th className="pb-2 font-medium text-right">Available</th>
								<th className="pb-2 font-medium text-right">Reorder Level</th>
								<th className="pb-2 font-medium text-right">Status</th>
							</tr>
						</thead>
						<tbody>
							{levels.map((level) => {
								const isLow = level.availableQuantity <= level.reorderLevel && level.reorderLevel > 0;
								return (
									<tr key={level.id} className="border-b last:border-0">
										<td className="py-3 font-mono">{level.itemCode ?? '—'}</td>
										<td className="py-3">{level.itemName ?? '—'}</td>
										<td className="py-3 text-right font-mono">
											{level.stockedQuantity} {level.uomSymbol}
										</td>
										<td className="py-3 text-right font-mono">
											{level.reservedQuantity} {level.uomSymbol}
										</td>
										<td className="py-3 text-right font-mono font-medium">
											{level.availableQuantity} {level.uomSymbol}
										</td>
										<td className="py-3 text-right font-mono">
											{level.reorderLevel} {level.uomSymbol}
										</td>
										<td className="py-3 text-right">
											{isLow ? (
												<Badge variant="destructive">Low Stock</Badge>
											) : (
												<Badge variant="secondary">In Stock</Badge>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
};

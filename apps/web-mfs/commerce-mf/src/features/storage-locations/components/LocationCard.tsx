import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteLocation } from '@/hooks/storage-locations';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { EditLocationDialog } from '../forms/EditLocationDialog';

interface LocationCardProps {
	location: StorageLocationData;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
	const navigate = useNavigate();
	const confirm = useConfirm();
	const deleteMutation = useDeleteLocation();
	const editDialog = useDialog();

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: `Delete "${location.name}"?`,
			description: 'This storage location will be permanently removed.',
			confirmLabel: 'Delete',
			variant: 'destructive',
		});
		if (confirmed) deleteMutation.mutate(location.id);
	};

	return (
		<>
			<div className="border rounded-xl bg-card p-4 flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-2 min-w-0">
						<Typography variant="subtitle2" className="truncate">
							{location.name}
						</Typography>
						{location.area && (
							<p className="text-sm text-muted-foreground truncate">{location.area}</p>
						)}
						<div className="flex items-center gap-2">
							<Badge variant="outline">{location.code}</Badge>
							<Badge variant={location.isActive ? 'secondary' : 'outline'}>
								{location.isActive ? 'Active' : 'Inactive'}
							</Badge>
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(buildSlug(location.name, location.id))}>
							<Eye className="size-4" />
						</Button>
						<Button variant="ghost" size="icon" className="size-7" onClick={editDialog.open}>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 text-destructive hover:text-destructive"
							onClick={handleDelete}
							disabled={!location.canDelete}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				</div>
			</div>

			<Dialog
				handle={editDialog}
				title="Edit Location"
				description="Update the storage location details."
				content={(close) => <EditLocationDialog location={location} onSuccess={close} onCancel={close} />}
			/>
		</>
	);
};

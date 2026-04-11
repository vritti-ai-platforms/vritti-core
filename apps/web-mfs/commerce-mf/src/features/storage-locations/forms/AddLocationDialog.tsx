import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateLocation } from '@/hooks/storage-locations';
import { type LocationFormData, locationFormResolver } from '@/schemas/storage-locations';

interface AddLocationDialogProps {
	onSuccess: () => void;
	onCancel: () => void;
}

export const AddLocationDialog: React.FC<AddLocationDialogProps> = ({ onSuccess, onCancel }) => {
	const form = useForm<LocationFormData>({
		resolver: locationFormResolver,
		defaultValues: { name: '', code: '', isActive: true, area: '', managerId: '', address: '' },
	});

	const createMutation = useCreateLocation({ onSuccess });

	return (
		<Form form={form} mutation={createMutation} showRootError resetOnSuccess onCancel={onCancel}>
			<TextField name="name" label="Name" placeholder="e.g. Walk-in Fridge" />
			<TextField name="code" label="Code" placeholder="e.g. WIF" />
			<TextField name="area" label="Area" placeholder="e.g. 500 sq ft" />
			<TextField name="managerId" label="Manager ID" placeholder="Manager user ID" />
			<TextArea name="address" label="Address" placeholder="Location address" />
			<Switch name="isActive" label="Active" description="Enable this storage location" />
			<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
				<Button type="button" variant="outline" data-cancel>
					Cancel
				</Button>
				<Button type="submit" loadingText="Creating...">
					Add Location
				</Button>
			</div>
		</Form>
	);
};

import type React from 'react';
import { EnrollmentsTable } from '@/components/suppliers/EnrollmentsTable';
import { enrollmentBinding } from '../../enrollmentBinding';

// The sites the supplier is enrolled at, each opening its enrollment
export const EnrollmentsTab: React.FC = () => <EnrollmentsTable binding={enrollmentBinding} mode="tab" />;

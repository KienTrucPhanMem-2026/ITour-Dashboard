'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import SharedSettings from '@/components/dashboard/SharedSettings';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <SharedSettings />
    </DashboardLayout>
  );
}

import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { usePatient, useUpdatePatient } from '@/api/patients';
import { getErrorMessage } from '@/api/errors';
import { ErrorState, LoadingState } from '@/components/ui';
import { PatientForm } from '@/components/PatientForm';

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);
  const updatePatient = useUpdatePatient(id ?? '');

  if (isLoading) return <LoadingState />;
  if (isError || !patient) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <PatientForm
      initial={patient}
      submitLabel="Guardar cambios"
      onSubmit={async (data) => {
        await updatePatient.mutateAsync(data);
        router.back();
      }}
    />
  );
}

import React from 'react';
import { router } from 'expo-router';
import { PatientForm } from '@/components/PatientForm';
import { useCreatePatient } from '@/api/patients';

export default function NewPatientScreen() {
  const createPatient = useCreatePatient();

  return (
    <PatientForm
      submitLabel="Registrar paciente"
      onSubmit={async (data) => {
        const patient = await createPatient.mutateAsync(data);
        router.replace({ pathname: '/(app)/patients/[id]', params: { id: patient.id } });
      }}
    />
  );
}

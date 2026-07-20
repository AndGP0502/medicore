import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  return <Redirect href={status === 'signedIn' ? '/(app)/(tabs)' : '/login'} />;
}

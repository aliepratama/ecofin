import { AuthAppShell } from '@/components/layout/AuthAppShell';

export const maxDuration = 60; // Allow AI endpoints up to 60 seconds

export default function AuthLayout(props: { children: React.ReactNode }) {      
  return <AuthAppShell>{props.children}</AuthAppShell>;
}

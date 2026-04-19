import { AuthAppShell } from '@/components/layout/AuthAppShell';

export default function AuthLayout(props: { children: React.ReactNode }) {
  return <AuthAppShell>{props.children}</AuthAppShell>;
}

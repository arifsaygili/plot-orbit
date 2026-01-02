"use client";

import { AuthShell, RegisterForm } from "@/components/auth";

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <RegisterForm />
    </AuthShell>
  );
}

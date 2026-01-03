import { Suspense } from "react";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInClient />
    </Suspense>
  );
}


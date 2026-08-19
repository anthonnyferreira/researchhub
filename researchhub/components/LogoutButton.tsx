"use client";

import { signOutAction } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOutAction()}
      className="hover:text-teal transition-colors"
    >
      Sair
    </button>
  );
}

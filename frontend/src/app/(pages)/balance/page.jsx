import { redirect } from "next/navigation";

export const metadata = {
  title: "Balance | Atlas Ops",
};

export default function BalancePage() { redirect('/facturacion'); }

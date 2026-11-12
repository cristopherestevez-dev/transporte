import { redirect } from "next/navigation";

export const metadata = {
  title: "Bienvenido | Atlas Ops",
};

export default async function HomePage() {
  redirect("/landing");
}

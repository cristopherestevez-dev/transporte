import LandingView from "@/app/views/Landing";

export const metadata = {
  title: "Bienvenido | Atlas Ops",
  alternates: { canonical: "https://atlasops.com.ar/landing" },
};

export default function LandingPage() {
  return <LandingView />;
}

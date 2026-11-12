import CamionesList from "@/app/views/CamionesList";

export const metadata = {
  title: "Camiones | Atlas Ops",
};

export default async function CamionesPage({ searchParams }) {
    return (
      <CamionesList notificationTab={(await searchParams)?.tab}/>
    );
  }

import CamionesList from "@/app/views/CamionesList";

export default async function CamionesPage({ searchParams }) {
    return (
      <CamionesList notificationTab={(await searchParams)?.tab}/>
    );
  }

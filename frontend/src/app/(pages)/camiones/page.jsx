import CamionesList from "@/app/views/CamionesList";

export default function CamionesPage({ searchParams }) {
    return (
      <CamionesList notificationTab={searchParams?.tab}/>
    );
  }

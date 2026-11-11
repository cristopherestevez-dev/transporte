import CamionProfile from "../../../views/CamionProfile";

export default async function Page({ params }) {
  const { id } = await params;
  return <CamionProfile id={id} />;
}

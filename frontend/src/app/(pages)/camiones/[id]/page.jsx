import CamionProfile from "../../../views/CamionProfile";

export const metadata = {
  title: "Detalle del camión | Atlas Ops",
};

export default async function Page({ params }) {
  const { id } = await params;
  return <CamionProfile id={id} />;
}

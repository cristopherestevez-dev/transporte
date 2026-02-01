import CamionProfile from "../../../views/CamionProfile";

export default function Page({ params }) {
  const { id } = params;
  return <CamionProfile id={id} />;
}

import LegalPage from "@/app/components/ui/LegalPage";

export const metadata = { title: "Términos de uso | Atlas Ops" };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso">
      <section>
        <h2>Uso del servicio</h2>
        <p>Atlas Ops es una herramienta para gestionar viajes, flota, choferes, liquidaciones y facturación. Las empresas y los usuarios autorizados deben usarla para sus tareas operativas y conforme a la normativa aplicable.</p>
      </section>
      <section>
        <h2>Cuentas y permisos</h2>
        <p>Cada persona debe usar su propia cuenta y cuidar sus credenciales. La empresa administra los perfiles de su equipo y debe revisar los permisos cuando cambian las funciones de una persona. Si sospechás de un acceso indebido, avisá a tu administrador y a soporte.</p>
      </section>
      <section>
        <h2>Información de la operación</h2>
        <p>La empresa debe contar con autorización o base legal para cargar datos de terceros y verificar que estén actualizados. Revisá los importes, los datos fiscales y los documentos antes de aprobar operaciones o emitir comprobantes.</p>
      </section>
      <section>
        <h2>Uso autorizado</h2>
        <p>Usá únicamente los registros a los que tengas acceso autorizado. Queda prohibido suplantar a otras personas, intentar acceder a empresas ajenas o interferir con el funcionamiento del servicio.</p>
      </section>
      <section>
        <h2>Consultas</h2>
        <p>Podés consultar sobre el servicio o informar un problema en <a className="underline" href="mailto:soporte@atlasops.com.ar">soporte@atlasops.com.ar</a>.</p>
      </section>
    </LegalPage>
  );
}

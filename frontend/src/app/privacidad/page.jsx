import LegalPage from "@/app/components/ui/LegalPage";

export const metadata = { title: "Política de privacidad | Atlas Ops" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad">
      <section>
        <h2>Datos que trata Atlas Ops</h2>
        <p>El inicio de sesión con Google puede proporcionar el nombre, el correo y la imagen de perfil. La aplicación registra la empresa, el perfil y los permisos de acceso. Los registros cargados por cada empresa pueden incluir datos de choferes, contactos, vehículos, viajes, liquidaciones y comprobantes.</p>
      </section>
      <section>
        <h2>Para qué se usan</h2>
        <p>Los datos se usan para habilitar el acceso, asignar permisos, gestionar la operación de cada empresa y atender consultas de soporte. El acceso de los usuarios a los registros depende de su empresa y de los permisos asignados.</p>
      </section>
      <section>
        <h2>Cookies y almacenamiento local</h2>
        <p>La aplicación usa cookies para mantener la sesión. También puede guardar datos de trabajo en el navegador, como valores de cotización y datos asociados a la edición de planillas.</p>
      </section>
      <section>
        <h2>Servicios externos</h2>
        <p>Google interviene en el inicio de sesión. Los proveedores de infraestructura prestan los servicios técnicos necesarios para alojar y operar la plataforma.</p>
      </section>
      <section>
        <h2>Tus derechos y contacto</h2>
        <p>Podés solicitar acceso, rectificación, actualización o supresión de tus datos, cuando corresponda, en <a className="underline" href="mailto:soporte@atlasops.com.ar">soporte@atlasops.com.ar</a>. Si tus datos los cargó una empresa usuaria, también podés dirigirle la solicitud. En Argentina, la <a className="underline" href="https://www.argentina.gob.ar/aaip/datospersonales/derechos">Agencia de Acceso a la Información Pública</a> informa cómo ejercer estos derechos y presentar reclamos.</p>
      </section>
    </LegalPage>
  );
}

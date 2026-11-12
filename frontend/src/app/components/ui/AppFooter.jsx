export function Copyright() {
  return <p>© {new Date().getFullYear()} Atlas Ops. Todos los derechos reservados.</p>;
}

export default function AppFooter({ className = "" }) {
  return (
    <footer className={`mt-auto shrink-0 border-t border-divider bg-background px-4 py-3 text-center text-xs text-default-600 ${className}`}>
      <Copyright />
    </footer>
  );
}

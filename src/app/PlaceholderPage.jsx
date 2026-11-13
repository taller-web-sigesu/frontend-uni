import { useMatches } from 'react-router';
import { EmptyState } from '../components/ui/index.js';

/** Pantalla provisional hasta que la fase correspondiente implemente la ruta. */
export default function PlaceholderPage() {
  const matches = useMatches();
  const title = matches.at(-1)?.handle?.title || 'En construcción';
  return (
    <section className="page">
      <h1>{title}</h1>
      <EmptyState title="Pantalla en construcción" description="Esta vista se implementa en una fase posterior del plan." />
    </section>
  );
}

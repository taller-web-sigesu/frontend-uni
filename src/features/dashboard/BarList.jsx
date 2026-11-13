/**
 * Barras horizontales en HTML/CSS. Cada barra lleva `aria-label` con etiqueta
 * y valor, y el valor también se ve como texto.
 */
export function BarList({ title, description, items }) {
  const max = Math.max(0, ...items.map((item) => item.value));
  return (
    <section className="card bar-list" aria-label={title}>
      <h2 className="bar-list__title">{title}</h2>
      {description && <p className="card__lead">{description}</p>}
      {items.length === 0 ? (
        <p className="bar-list__empty">Sin solicitudes en el rango.</p>
      ) : (
        <ul className="bar-list__items">
          {items.map((item) => (
            <li key={item.key ?? item.label} className="bar-list__row">
              <span className="bar-list__label">{item.label}</span>
              <span className="bar-list__track" role="img" aria-label={`${item.label}: ${item.value}`}>
                <span className="bar-list__bar" style={{ width: max ? `${(item.value / max) * 100}%` : 0 }} />
              </span>
              <span className="bar-list__value" aria-hidden="true">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

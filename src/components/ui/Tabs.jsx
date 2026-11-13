import { useId, useRef, useState } from 'react';

/**
 * Pestañas accesibles (flechas izquierda/derecha entre pestañas). `tabs`:
 * `[{ id, label, render }]`; solo se monta el panel activo.
 */
export function Tabs({ label, tabs, initial }) {
  const [active, setActive] = useState(initial || tabs[0].id);
  const baseId = useId();
  const refs = useRef({});
  const current = tabs.find((tab) => tab.id === active) || tabs[0];

  function handleKeyDown(event, index) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => {
          const selected = tab.id === current.id;
          return (
            <button
              key={tab.id}
              ref={(node) => { refs.current[tab.id] = node; }}
              type="button"
              role="tab"
              id={`${baseId}-${tab.id}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${tab.id}-panel`}
              tabIndex={selected ? 0 : -1}
              className="tabs__tab"
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-${current.id}-panel`}
        aria-labelledby={`${baseId}-${current.id}-tab`}
        className="tabs__panel"
      >
        {current.render()}
      </div>
    </div>
  );
}

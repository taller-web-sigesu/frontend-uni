import { useId, useRef, useState } from 'react';

/**
 * Pestañas accesibles. `tabs`: `[{ id, label, render }]`; solo se monta el contenido activo.
 */
export function Tabs({ label, tabs, initial }) {
  const [active, setActive] = useState(initial || tabs[0].id);
  const baseId = useId();
  const refs = useRef({});
  const current = tabs.find((tab) => tab.id === active) || tabs[0];

  function handleKeyDown(event, index) {
    let nextIndex;
    switch (event.key) {
      case 'ArrowRight': nextIndex = (index + 1) % tabs.length; break;
      case 'ArrowLeft': nextIndex = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    const next = tabs[nextIndex];
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
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${baseId}-${tab.id}-panel`}
          aria-labelledby={`${baseId}-${tab.id}-tab`} className="tabs__panel" hidden={tab.id !== current.id}>
          {tab.id === current.id && tab.render()}
        </div>
      ))}
    </div>
  );
}

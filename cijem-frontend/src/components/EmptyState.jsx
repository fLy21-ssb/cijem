const EmptyState = ({ titulo = 'Sin datos', descripcion = '' }) => (
  <div className="empty-state">
    <p className="empty-state-title">{titulo}</p>
    {descripcion && <p className="empty-state-desc">{descripcion}</p>}
  </div>
);

export default EmptyState;

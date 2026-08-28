const CLASES_ESTADO = {
  Verde: 'badge badge-normal',
  Amarillo: 'badge badge-alerta',
  Rojo: 'badge badge-critico',
};

const EstadoBadge = ({ estado, label }) => (
  <span className={CLASES_ESTADO[estado] || 'badge'}>{label}</span>
);

export default EstadoBadge;

/* ============ funding.js — donaciones ============
 * Las donaciones son voluntarias, no dan ninguna ventaja en el juego y se
 * usan sólo para mantenerlo en línea: servidores y dominio.
 * Este archivo es la fuente de lo que se enseña en el juego (botón "Apoyar")
 * y en la página /apoyar/. Se actualiza a mano:
 *
 *   kofi      usuario de Ko-fi (vacío = el botón no sale)
 *   sponsors  usuario de GitHub Sponsors (para quien entra al repositorio)
 *   costs     gastos [concepto, euros al mes]; si el coste no es fijo, un texto
 */
G.Funding = {
  // MOD nico: versión no oficial sin donaciones (los sprites son CC BY-NC y el dinero no
  // debe parecer que financia esta copia). Vacío = no sale el botón Apoyar ni el aviso.
  kofi: '',
  sponsors: '',
  costs: [
    ['Servidores (partidas, cuentas, ranking y multijugador)', 'Según cuánta gente juegue'],
    ['Dominio pokesurvivor.com', '≈12 € al año']
  ],
  get url() { return this.kofi ? 'https://ko-fi.com/' + this.kofi : ''; }
};

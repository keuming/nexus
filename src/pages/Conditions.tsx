/** Conditions de réservation affichées avant l'acceptation. */
export function Conditions() {
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="space-y-1"><h2 className="font-semibold">{t}</h2><p className="text-sm text-zinc-300">{children}</p></section>;
  return (
    <article className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Conditions de réservation</h1>
      <S t="1. Rôle de BackMarket">BackMarket met en relation les clients et des prestataires indépendants (transport, hébergement, restauration, loisirs…). Le service est fourni par le prestataire choisi ; BackMarket n'en est ni le vendeur ni le transporteur.</S>
      <S t="2. Réservation">Une réservation est confirmée lorsque le paiement est reçu (ou immédiatement pour une offre gratuite). Elle donne lieu à un numéro de réservation à présenter au prestataire. Les informations saisies (identité, téléphone, e-mail, noms des passagers) doivent être exactes.</S>
      <S t="3. Paiement">Le paiement s'effectue par Mobile Money via ORZAYAH. Les places sont réservées pendant la durée du paiement ; sans validation dans ce délai, la réservation est libérée et aucun montant n'est conservé.</S>
      <S t="4. Annulation et remboursement">Les modalités d'annulation et de remboursement d'une réservation payée sont celles du prestataire : contactez-le en indiquant votre numéro de réservation. Une offre gratuite peut être annulée depuis « Mes réservations ».</S>
      <S t="5. Données personnelles">Vos coordonnées sont transmises au prestataire concerné pour exécuter la réservation et ne sont utilisées par BackMarket que pour la gestion de celle-ci.</S>
      <S t="6. Réclamations">Pour toute difficulté, contactez d'abord le prestataire, puis BackMarket avec votre numéro de réservation.</S>
    </article>
  );
}

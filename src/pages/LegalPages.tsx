import type { ReactNode } from 'react';
import { SITE } from '../../shared/site';

const S = ({ t, children }: { t: string; children: ReactNode }) => <section className="space-y-1"><h2 className="font-semibold">{t}</h2><p className="text-sm text-zinc-300">{children}</p></section>;

export function Privacy() {
  return (
    <article className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Politique de confidentialité</h1>
      <S t="Données collectées">Lors de l’inscription et d’une réservation : nom, e-mail, téléphone, noms des passagers ou participants, demandes particulières, et le numéro Mobile Money saisi pour le paiement.</S>
      <S t="Utilisation">Ces données servent uniquement à créer votre compte, exécuter vos réservations, traiter les paiements et vous envoyer des confirmations. Elles sont transmises au prestataire concerné par votre réservation.</S>
      <S t="Paiement">Le paiement est traité par ORZAYAH. {SITE.name} ne conserve pas votre code secret Mobile Money et n’affiche votre numéro que masqué.</S>
      <S t="Conservation et droits">Vous pouvez demander l’accès, la correction ou la suppression de vos données en écrivant à {SITE.email}.</S>
      <S t="Cookies">Un cookie de session strictement nécessaire vous maintient connecté ; aucun cookie publicitaire n’est utilisé.</S>
    </article>
  );
}

export function Legal() {
  return (
    <article className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Mentions légales</h1>
      <S t="Éditeur">{SITE.name}, service édité par {SITE.company}. Siège : {SITE.address}. Contact : {SITE.email}.</S>
      <S t="Hébergement">Application hébergée par Vercel Inc., base de données par Neon.</S>
      <S t="Paiements">Les paiements par Mobile Money sont traités par ORZAYAH.</S>
      <S t="Responsabilité">Les offres sont publiées par des prestataires indépendants, responsables de leurs services. {SITE.name} met en relation clients et prestataires.</S>
    </article>
  );
}

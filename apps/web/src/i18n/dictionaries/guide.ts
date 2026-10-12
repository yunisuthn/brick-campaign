/**
 * The Guide screen (reference document, section 10.14). `{section}`, `{action}` and the like are
 * filled with the interface's own labels, so a renamed button is renamed here too.
 */
export const fr = {
  'guide.subtitle': 'Les manipulations pas à pas, dans l’ordre de la saison.',
  'guide.open': 'Ouvrir {section}',

  'guide.campaign.title': 'Démarrer une campagne',
  'guide.campaign.step1': 'Ouvrez {section}, puis « {action} ».',
  'guide.campaign.step2':
    'Saisissez l’année, la tranche (1 pour la première de l’année, puis 2, 3…) et la date de début, puis « {action} ».',
  'guide.campaign.step3':
    'Choisissez-la dans « {picker} », en haut de l’écran : chaque saisie va dans la campagne choisie.',
  'guide.campaign.step4':
    'Ouvrez la campagne, puis « {action} » pour fixer les prix à la brique du moulage, du transport et de l’enfournement.',
  'guide.campaign.note':
    'Un tarif peut rester « À fixer ». Les montants qui en dépendent s’affichent « tarif à fixer » ; une fois fixé, il vaut pour toutes les saisies de la campagne.',

  'guide.people.title': 'Ajouter un mouleur, une rizière ou un client',
  'guide.people.step1':
    'Ouvrez {moulders}, {riceFields} ou {clients} (dans « {more} » sur téléphone).',
  'guide.people.step2':
    'Appuyez sur « {newMoulder} », « {newRiceField} » ou « {newClient} » et remplissez la fiche.',
  'guide.people.step3': 'Ces fiches servent à toutes les campagnes : on ne les crée qu’une fois.',
  'guide.people.note':
    'Un mouleur qui arrête se retire depuis sa fiche (« {action} ») : il n’est plus proposé dans les saisies, son historique reste.',

  'guide.production.title': 'Saisir les briques d’un mouleur',
  'guide.production.step1': 'Ouvrez {section}, puis « {action} ».',
  'guide.production.step2':
    'Choisissez la date de début, le mouleur, la rizière et le tarif de moulage, puis la quantité de briques.',
  'guide.production.step3':
    'Enregistrez. Le formulaire garde la date, la rizière et le tarif : choisissez le mouleur suivant et continuez.',
  'guide.production.step4':
    'Quand le travail est terminé, ouvrez la production dans la liste et renseignez la date de fin.',
  'guide.production.note':
    'Chaque production ajoute ses briques au stock crue et à ce qui est dû au mouleur.',

  'guide.payment.title': 'Payer un mouleur ou un prestataire',
  'guide.payment.step1': 'Ouvrez {section}, puis « {action} ».',
  'guide.payment.step2': 'Choisissez le bénéficiaire : un mouleur, ou un prestataire par son nom.',
  'guide.payment.step3':
    'Choisissez le type, {vatsy}, {advance}, {fee} (matériel retenu sur le dû) ou {settlement}, puis la date et le montant.',
  'guide.payment.note':
    'Au plus un vatsy et une avance par jour, et un seul frais par mouleur et par campagne.',

  'guide.kiln.title': 'Enfourner puis défourner un lot',
  'guide.kiln.step1': 'Ouvrez {section}, puis « {action} ». Le stock crue disponible s’affiche.',
  'guide.kiln.step2':
    'Saisissez la date d’enfournement et la quantité : 40 000 briques au moins, jamais plus que le stock crue. Appuyez sur « {action} ».',
  'guide.kiln.step3':
    'Sur la fiche du lot, « {action} » pour le transport vers le four et l’enfournement.',
  'guide.kiln.step4':
    'Au défournement, ouvrez le lot et renseignez la date de défournement : ses briques passent en cuite.',
  'guide.kiln.note': 'Seules les briques cuites peuvent être livrées.',

  'guide.sale.title': 'Vendre, livrer, encaisser',
  'guide.sale.step1':
    'Ouvrez {section}, puis « {action} » : client, date, quantité commandée et prix unitaire. Une vente s’enregistre même sans brique cuite.',
  'guide.sale.step2': 'À chaque voyage de camionnette, ouvrez la vente, puis « {action} ».',
  'guide.sale.step3': 'À chaque paiement du client, ouvrez la vente, puis « {action} ».',
  'guide.sale.step4': 'Le statut suit tout seul : {ordered}, {delivered}, {partiallyPaid}, {paid}.',
  'guide.sale.note':
    'Un voyage est refusé si le stock cuite ne suffit pas, un encaissement s’il dépasse ce qui reste à payer.',

  'guide.expense.title': 'Saisir une dépense',
  'guide.expense.step1': 'Ouvrez {section}, puis « {action} ».',
  'guide.expense.step2': 'Choisissez la catégorie, la date, le montant et un libellé.',
  'guide.expense.step3':
    'Rattachez-la à un lot (akofa, tai-charbon) pour qu’elle compte dans le coût du lot, ou à une rizière pour son contrat.',

  'guide.end.title': 'Finir la campagne',
  'guide.end.step1':
    'Ouvrez {section} : le reste dû de chaque mouleur et de chaque prestataire s’affiche.',
  'guide.end.step2':
    'Appuyez sur « {action} », puis confirmez le montant : un versement de solde est créé à la date du jour.',
  'guide.end.step3': 'Ouvrez {section}, la campagne, puis « {action} » avec la date de clôture.',
  'guide.end.note':
    'Une campagne clôturée se choisit toujours dans le sélecteur pour relire ses chiffres ; aucune saisie n’y est acceptée après sa date de clôture.',

  'guide.fix.title': 'Corriger ou annuler une saisie',
  'guide.fix.step1':
    'Ouvrez la saisie depuis sa liste : production, versement, lot, vente, dépense…',
  'guide.fix.step2': 'Modifiez les champs, puis « {action} ».',
  'guide.fix.step3': 'Pour l’annuler, appuyez sur le bouton rouge « Annuler… », puis confirmez.',
  'guide.fix.note':
    'Rien n’est effacé : une saisie annulée sort des calculs mais reste dans l’historique. Une vente ne s’annule qu’une fois ses voyages et ses encaissements annulés.',
} as const;

export const mg: Record<keyof typeof fr, string> = {
  'guide.subtitle': 'Ny fomba fanaovana tsikelikely, araka ny filaharan’ny vanim-potoana.',
  'guide.open': 'Sokafy {section}',

  'guide.campaign.title': 'Manomboka vanim-potoana',
  'guide.campaign.step1': 'Sokafy {section}, avy eo « {action} ».',
  'guide.campaign.step2':
    'Ampidiro ny taona, ny tranche (1 ho an’ny voalohany amin’ny taona, avy eo 2, 3…) sy ny daty nanombohana, avy eo « {action} ».',
  'guide.campaign.step3':
    'Fidio ao amin’ny « {picker} » eo ambony izy : izay ampidirina rehetra dia mankao amin’ny vanim-potoana voafidy.',
  'guide.campaign.step4':
    'Sokafy ilay vanim-potoana, avy eo « {action} » mba hamaritana ny vidiny isaky ny biriky amin’ny fanaovana biriky, ny fitaterana ary ny fampidirana ao am-patana.',
  'guide.campaign.note':
    'Mety hijanona « Mbola hofaritana » ny tarifa. Ireo vola miankina aminy dia aseho « mbola hofaritana » ; rehefa voafaritra izy dia mihatra amin’izay rehetra voarakitra tao amin’ny vanim-potoana.',

  'guide.people.title': 'Manampy mpanao biriky, tanimbary na mpanjifa',
  'guide.people.step1':
    'Sokafy {moulders}, {riceFields} na {clients} (ao amin’ny « {more} » amin’ny finday).',
  'guide.people.step2':
    'Tsindrio « {newMoulder} », « {newRiceField} » na « {newClient} » ary fenoy ny taratasy.',
  'guide.people.step3':
    'Ampiasaina amin’ny vanim-potoana rehetra ireo : indray mandeha ihany no amoronana azy.',
  'guide.people.note':
    'Ny mpanao biriky mijanona dia esorina avy amin’ny taratasiny (« {action} ») : tsy aroso intsony izy rehefa mampiditra, fa mijanona ny tantarany.',

  'guide.production.title': 'Mampiditra ny biriky nataon’ny mpanao biriky',
  'guide.production.step1': 'Sokafy {section}, avy eo « {action} ».',
  'guide.production.step2':
    'Fidio ny daty nanombohana, ny mpanao biriky, ny tanimbary sy ny tarifa, avy eo ny isan’ny biriky.',
  'guide.production.step3':
    'Raketo. Tazonin’ny taratasy ny daty, ny tanimbary sy ny tarifa : fidio ny mpanao biriky manaraka ary tohizo.',
  'guide.production.step4':
    'Rehefa vita ny asa, sokafy ilay famokarana ao amin’ny lisitra ary ampidiro ny daty nifaranana.',
  'guide.production.note':
    'Ny famokarana tsirairay dia manampy ny biriky manta sy izay tokony haloa amin’ilay mpanao biriky.',

  'guide.payment.title': 'Mandoa mpanao biriky na mpiasa',
  'guide.payment.step1': 'Sokafy {section}, avy eo « {action} ».',
  'guide.payment.step2': 'Fidio izay handray : mpanao biriky, na mpiasa amin’ny anarany.',
  'guide.payment.step3':
    'Fidio ny karazany, {vatsy}, {advance}, {fee} (fitaovana nalaina tamin’ny trosa) na {settlement}, avy eo ny daty sy ny vola.',
  'guide.payment.note':
    'Vatsy iray sy avance iray isan’andro farafahabetsany, ary frais iray monja isaky ny mpanao biriky sy isaky ny vanim-potoana.',

  'guide.kiln.title': 'Mampiditra sy mamoaka biriky ao am-patana',
  'guide.kiln.step1': 'Sokafy {section}, avy eo « {action} ». Aseho ny biriky manta misy.',
  'guide.kiln.step2':
    'Ampidiro ny daty nampidirana sy ny isa : 40 000 biriky farafahakeliny, tsy mihoatra ny biriky manta misy. Tsindrio « {action} ».',
  'guide.kiln.step3':
    'Ao amin’ny taratasin’ny fandoroana, « {action} » ho an’ny fitaterana mankany am-patana sy ny fampidirana.',
  'guide.kiln.step4':
    'Rehefa avoaka, sokafy ilay fandoroana ary ampidiro ny daty namoahana : lasa biriky masaka ireo biriky ireo.',
  'guide.kiln.note': 'Ny biriky masaka ihany no azo aterina.',

  'guide.sale.title': 'Mivarotra, mitatitra, mandray vola',
  'guide.sale.step1':
    'Sokafy {section}, avy eo « {action} » : mpanjifa, daty, isa nobaikoina ary vidiny isaky ny iray. Azo raketina na dia mbola tsy misy biriky masaka aza ny varotra.',
  'guide.sale.step2': 'Isaky ny dian’ny fiara, sokafy ilay varotra, avy eo « {action} ».',
  'guide.sale.step3': 'Isaky ny mandoa ny mpanjifa, sokafy ilay varotra, avy eo « {action} ».',
  'guide.sale.step4': 'Miova ho azy ny toerany : {ordered}, {delivered}, {partiallyPaid}, {paid}.',
  'guide.sale.note':
    'Lavina ny dia raha tsy ampy ny biriky masaka, ary ny fandraisam-bola raha mihoatra izay sisa tokony haloa.',

  'guide.expense.title': 'Mampiditra fandaniana',
  'guide.expense.step1': 'Sokafy {section}, avy eo « {action} ».',
  'guide.expense.step2': 'Fidio ny sokajy, ny daty, ny vola ary soraty ny antony.',
  'guide.expense.step3':
    'Ampifandraiso amin’ny fandoroana (akofa, tai-charbon) mba hidirany ao amin’ny vidin’ilay fandoroana, na amin’ny tanimbary ho an’ny fifanarahana.',

  'guide.end.title': 'Mamarana ny vanim-potoana',
  'guide.end.step1':
    'Sokafy {section} : aseho izay sisa tokony haloa amin’ny mpanao biriky sy mpiasa tsirairay.',
  'guide.end.step2':
    'Tsindrio « {action} », avy eo hamafiso ny vola : misy fandoavam-bola sisa voarakitra amin’ny daty androany.',
  'guide.end.step3':
    'Sokafy {section}, ilay vanim-potoana, avy eo « {action} » miaraka amin’ny daty fanakatonana.',
  'guide.end.note':
    'Mbola azo fidiana ao amin’ny mpifidy ny vanim-potoana voakatona mba hamakiana ny isany ; tsy misy fampidirana ekena intsony aorian’ny daty fanakatonana.',

  'guide.fix.title': 'Manitsy na manafoana fampidirana',
  'guide.fix.step1':
    'Sokafy ilay fampidirana avy amin’ny lisitra misy azy : famokarana, fandoavam-bola, fandoroana, varotra, fandaniana…',
  'guide.fix.step2': 'Ovay ny saha, avy eo « {action} ».',
  'guide.fix.step3': 'Raha hanafoana azy, tsindrio ilay bokotra mena « Foano… », avy eo hamafiso.',
  'guide.fix.note':
    'Tsy misy voafafa : ny fampidirana nofoanana dia tsy isaina intsony fa mijanona ao amin’ny tantara. Ny varotra dia tsy azo foanana raha tsy efa nofoanana ny diany sy ny vola voarainy.',
};

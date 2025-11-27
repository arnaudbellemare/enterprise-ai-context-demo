/**
 * Test endpoint with real property management emails
 * For testing classification with actual email examples
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyEmailHybrid, EMAIL_TEMPLATES } from '../../../lib/email-template-classifier';
import { getExamples } from '../../../lib/email-examples-store';

// Real email examples from user
const REAL_EMAILS = [
  {
    id: 'email-1',
    text: `Hi Chantal,

I hope this email finds you well.

Following our meeting last week, it appears the guards have not implemented the measures we discussed, particularly regarding cell phone usage and keeping the desk tidy. Do you happen to have the name of the new guard yet?

Arnaud — when are we scheduled to meet with the guards to review the rules and regulations, as well as the A4 signage?

Many thanks,
Julie`
  },
  {
    id: 'email-2',
    text: `Hi Chantal,

Please find attached the meeting minutes, along with a reminder of the protocol we need to enforce.

Thank you.`
  },
  {
    id: 'email-3',
    text: `Hello Julie,

Please find attached the schedule for the current week.

For your information, we have already spoken with Mr. Milor regarding the night shift reports, and the situation has now been resolved.

Thank you!`
  },
  {
    id: 'email-4',
    text: `Hi Chantal,

Can you please send us the current schedule of the security guards, including their assigned times?

Additionally, we've noticed that we have not been receiving any weekend reports for the midnight to 6 am shifts. Could you please look into this and confirm why those reports are missing?

Lastly, please remove all reports currently being sent to Ascentia.

-Julie`
  },
  {
    id: 'email-5',
    text: `Hi Julie,

You can send us an invitation for the meeting on Monday at 3:15 pm, that works for us!`
  },
  {
    id: 'email-6',
    text: `Hi Chantal,

Can you please let us know when you're available?

Thank you,
Julie`
  },
  {
    id: 'email-7',
    text: `Hi Chantal,

Would it be possible to schedule our meeting for Monday, November 17, any time after 3:00 PM?

The topics I'd like to discuss include:

• Guards' cell phone usage
• Completing rounds on all floors
• Move-in and move-out procedures
• Email setup to ensure guards receive announcements
• Training from the new Property Manager, Arnaud (every new guard meets with Arnaud)
• Taking breaks in the breakroom (not at the desk) and maintaining a clean workstation

Additionally, please provide us with the current guard schedule and shift timings and share any feedback from the guards regarding their experience working in the building.

Many thanks,
Julie`
  },
  {
    id: 'email-8',
    text: `Bonjour,

Si tu peux me donner deux dates je vais m'ajuster et en choisir une, nous sommes disponibles pour nos clients,

En attente de votre retour,`
  },
  {
    id: 'email-9',
    text: `Hi,

The board of directors would like to schedule a meeting with AG3 to recap the services provided since you started, refresh the protocols and tasks for security following the change in management. Please let me know your availability so I can coordinate with the board's schedule to find a suitable time.

Thank you !`
  },
  {
    id: 'email-10',
    text: `Hi,

See attached the attestation request documentation.

Thank you.`
  },
  {
    id: 'email-11',
    text: `Thank you for your email, I will pay the fee associated with the document, as soon as I receive it.

Thank you`
  },
  {
    id: 'email-12',
    text: `Hi,

We confirm that, as the management of the Condominium Association, we are obligated to provide this document to any co-owner who intends to sell their unit.

This obligation is stipulated in the Declaration of Co-ownership as follows:

The board of directors (management) must, "from the end of the term of the provisional administrator, within 15 days of the date of the request, provide any co-owner who intends to sell their unit with a certificate from the condominium corporation regarding the condition of the co-ownership."

The relevant clause concerning this obligation to provide this certificate is section 10.3.7.32 of the Declaration of Co-ownership.

Administrative Fees

Please note that the preparation and provision of this document incurs administrative fees, which are set out in the Declaration of Co-ownership and are billed to the selling co-owner (the seller).

The applicable fees are as follows:

Amount: $225 per event.

These fees relate to the "providing a co-owner with a certificate from the condominium association regarding the condition of the condominium".

The clause specifying these fees is section 14.6.5.3 of the Declaration of Co-ownership, stipulating that these fees are "payable by the transferring co-owner, unless otherwise agreed in writing to the board of directors".

We will prepare and send this certificate as soon as possible. The invoice for administrative fees will be sent to you for payment if accepted.

Thank you.`
  },
  {
    id: 'email-13',
    text: `Dear Management:

This is the owner of the unit 701, I would like to request the management to send me the law 16 attestation. I have a buyer that requires it, as by law it is legally to be provided by the building management upon request.

Please send me and my courtier both the documents

His email is paulma.realtor@gmail.com

Kai Liu

Thank you`
  },
  {
    id: 'email-14',
    text: `Hi,

The heat has already been turned on in the common areas. If you're experiencing any issues, it might be a problem with your unit's heating system itself. Please note that the heat is not activated individually from your unit; it is centrally controlled from the panel in the mechanical room by our technicians, and it has already been turned on.

I suggest reaching out to Climactic so they can assist you directly. If the issue stems from the building itself or the common areas, the HVAC company will notify us, and we'll handle it with them. Otherwise, it will be addressed as a unit-specific matter.

If you have any further questions, feel free to let me know.`
  },
  {
    id: 'email-15',
    text: `Thank you for the information. I would just like some clarification regarding the form. Since the heating needs to be turned on for the entire floor, not just our unit, I'm unsure why this form is required. We were previously told that someone would be coming to activate the heating regardless.

If the form is necessary, could you please confirm what we should enter under "Billing Name," as we are not responsible for the costs associated with this issue?

Thank you.`
  },
  {
    id: 'email-16',
    text: `Hi,

To schedule a visit from our air conditioning technicians, please fill out the form at the following address: http://www.climactic.ca/en/condo. Once you have completed the form, the company will contact you by email to set a date for the service call.

We are, of course, available to assist you in making an appointment and to answer any questions you may have about air conditioning issues in the common areas. Please feel free to email us if you need further information or encounter any difficulties.

As a reminder, the management company only handles issues related to common areas. Air conditioning, electrical, or plumbing issues inside your unit are the responsibility of the co-owner.

Thank you for your cooperation.`
  },
  {
    id: 'email-17',
    text: `Good afternoon,

We contacted the Ascentia office earlier in October regarding the heating in our unit (2405). We were informed that the heating for the entire floor would be turned on by the end of October at the latest. However, we still do not have any heating in our unit, despite having the thermostat switched on.

Could you please arrange for someone to inspect this as soon as possible? It's getting increasingly cold, and we'd appreciate prompt assistance.

Thank you.

Regards,

Julia`
  },
  {
    id: 'email-18',
    text: `Bonjour Arnaud,

Merci des infos, mais je cherche à savoir ce que réellement est fait pour assurer la sécurité de nos locataires? Et ce, immédiatement! Vendredi dernier ils m'ont littéralement dit qu'ils avaient peur de simplement ouvrir la porte et de descendre dans l'ascenseur. Cela est complètement inacceptable.

Si ce n'est pas la première fois que le co-propriétaire du 2303 a été averti, il démontre clairement qu'il s'en fou. On ne peut pas attendre des mois encore pour voir si quelque chose sera fait ou non.

Je veux svp que quelque chose soit mise en place immédiatement pour avoir ces personnes expulsées de l'immeuble car nous ne pouvons pas perdre des locataires à cause d'eux. Je comprends que le TAL c'est long, mais sinon la prochaine étape c'est la police avec des plaintes officielles.

Est-ce qu'au minimum vous pouvez ouvrir immédiatement vous aussi un dossier d'expulsion au TAL? Quel autre recours avons-nous?

Si c'était un hôtel, les personnes seraient expulsées sur le champ, alors ça ne devrait pas être différent ici. Tu seras d'accord avec moi que ce n'est pas acceptable qu'une personne ne se sente pas en sécurité chez soi.

Merci de ton temps et de ton aide.`
  },
  {
    id: 'email-19',
    text: `Hi,

Thank you for your detailed email. We fully understand how distressing and unacceptable the events of November 14 were, especially the use of pepper spray in the common areas and the impact it had on your tenant and others on the 23rd floor. The safety and peaceful enjoyment of all residents is our top priority and were managing this with the police and the security when we received the call on November 14.

Please be assured that this file is already active and has been for several weeks:

The syndicate has been in direct and ongoing contact with the co-owner of unit 2303.

Two formal notices have already been sent to the co-owner.

Significant fines have been systematically applied to the unit's condo fee account for each verified infraction (disrespectful behaviour, etc.).

We have formally requested that the co-owner immediately take the necessary steps to terminate the lease and evict the tenants.

Your email and the attached documentation (including the fire and police department intervention and your tenant's messages) will be immediately added to the file as additional proof of the seriousness and repetition of the disturbances.

If the co-owner does not act quickly or does not obtain an eviction order from the Tribunal administratif du logement (TAL) himself, the syndicate is fully prepared to file its own application with the TAL to request the termination of the lease and the expulsion of these tenants. We are already gathering all required evidence to do so. As you know, TAL procedures unfortunately take a minimum of 2–3 months once the file is filed, but we are moving as quickly as the legal process allows.`
  },
  {
    id: 'email-20',
    text: `Good day,

A very serious matter happened last Friday with one of our tenants that really needs to be taken care of ASAP before we decide to involve the police in the matter.

We own 4 properties in the Enticy building, 2305, 2306, 2308, 2310. As a result we pay in excess of 2000$ / month in condo fees and in return we expect to have adequate service and follow ups. Right now we don't even know who the building manager, is since Ascentia was removed from duty.

Last Friday, November 14, 2025, one of our tenants on the 23rd floor contacted us late in the evening to tell us that they had a very hard time to breath inside their condo because something with a strong spicy smell was in the air. They eventually called the fire department which came in the building to asses the situation. It was ultimately determined that it was pepper spray that had been used on the floor which in turn, affected everyone there. It was also reported that someone from the unit 2303 went down to see the security guard to ask him for help to clean out his eyes since someone from that unit had sprayed him with pepper spray in his face, which in turn confirms the fire departments assessment.

This is not the first time that the people living in 2303 disturb our tenants. I have attached pictures of our latest conversation with our tenant that indicates that they do not feel safe in there own home. That these people are often very loud at all times of the night, very disturbfull and disrespectful. They even made racial comments once towards our tenant while they were in the elevator. And as a result of all of this, we are loosing these tenants since, understandably, they do not want to live in such an environment. Also, I had already sent an email on September 23rd to Ascentia to report other issues that were related to those same people which stated that they were often yelling, fighting, loud music, also they leave their trash outside the door or just on the floor of the garbage disposal room. Ascentia's reply was simply that they would remind the occupants of the building rules, but now we are past this. These people clearly don't care about the rules and regulations. We are at a point that they need to either leave the building or comply and understand that this is not a frat house.

Considering all of the above, considering the racial comments, considering the utmost lack of care for others, and considering also that pepper spray is illegal in Canada, I am very tempted to involve the police in this matter.

This situation needs to be resolved!!! We can not have people scaring our tenants away in a place that we pay so much money to simply own.`
  },
  {
    id: 'email-21',
    text: `Bonjour Ian, merci pour l'encouragement.

1. Raison du changement de gestionnaire de l'immeuble

Le Conseil d'administration a choisi une nouvelle compagnie de gestion plus petite, plus disponible, moins coûteuse et dédiée exclusivement à votre syndicat. L'objectif était d'obtenir un meilleur suivi au quotidien et une plus grande réactivité, contrairement à une grande firme qui gère plusieurs immeubles et dont les honoraires étaient plus élevés.

2. Utilité et destination des frais mentionnés

Tous les frais ci-dessous sont des frais administratifs ou pénalités payables au syndicat. Ils figurent à l'article 14.6.5 de la Déclaration de copropriété (extrait ci-dessous pour référence) :

Frais de supervision générale d'un déménagement ou emménagement : 250 $ par événement

Frais de déménagement (réservation d'ascenseur + supervision) : les déménagements doivent obligatoirement avoir lieu du lundi au samedi, de 8 h à 18 h, et être déclarés au moins 15 jours à l'avance.

14.6.5.9 Fee for general supervision of a move or move-in, as performed by a director or manager: $250.00 per event;

Le montant perçu par le syndicat (250 $ par déménagement) sert à couvrir :

les risques de bris ou d'usure prématurée de l'ascenseur,

les éventuelles réparations futures,

ainsi que les frais de gestion et de supervision liés à la réservation et au suivi de l'opération.

Autres frais prévus à la Déclaration de copropriété (14.6.5) :

Frais de gestion pour un événement imputable à un copropriétaire : 150 $/heure (minimum 3 h)

Intervention du concierge : 100 $/heure

Nettoyage : 100 $/heure

Dépôt de garantie (dommages) : 500 $ par événement

Frais de registre de la copropriété : 50 $/heure

3. Impact du changement de gestionnaire sur vos frais de condo

Le nouveau contrat est moins coûteux que l'ancien. Cela devrait donc se traduire, toutes choses égales par ailleurs, par une baisse de la portion « frais de gestion » dans le budget à venir et, par conséquent, dans vos frais de condo mensuels.

4. Conseil d'administration : composition et prochaine assemblée

Le syndicat est maintenant passé au Conseil d'administration permanent composé de 3 membres élus pour un mandat d'un an lors de l'assemblée générale annuelle (AGA). (voir le procès-verbal de l'AGA que vous devriez avoir reçue par Ascentia)

Une AGA doit être convoquée dans les 90 jours suivant la fin de l'exercice financier. Elle devrait donc avoir lieu très prochainement. Nous vous invitons à y assister ou à consulter le procès-verbal qui sera envoyé par la suite pour connaître la composition exacte du CA.

6. Contact direct d'un garde de sécurité pour les locataires

Vous pouvez transmettre ce numéro à vos locataires en cas de besoin :

Sécurité : 514-679-8946

En cas de danger immédiat (cris, bagarre, menace), il est évidemment recommandé d'appeler directement le 911.

7. Stationnement non autorisé (places SS14-5-6-7)

Les places de stationnement intérieures sont des parties communes à usage restreint. Tout copropriétaire est responsable des infractions commises par ses locataires ou visiteurs.

Moyens d'action du syndicat

Application systématique de pénalités et frais administratifs

Possibilité de recours judiciaires si nécessaire

Installation d'un dispositif de blocage (cône, poteau, etc.)

L'installation de tout objet, même amovible, sur une place de stationnement constitue une modification des parties communes à usage restreint et est strictement interdite sans autorisation écrite préalable du Conseil d'administration.

De plus, les règlements interdisent expressément toute construction ou installation dans les espaces de stationnement intérieur.

Recommandation : Nous transmettre ou Sécurité : 514-679-8946 systématiquement photos + plaque d'immatriculation des véhicules en infraction.

Chaque cas documenté permet au syndicat d'appliquer des pénalités au propriétaire du véhicule ou à son copropriétaire. C'est actuellement la méthode la plus efficace et pleinement conforme aux règlements.

N'hésitez pas si vous avez d'autres questions.`
  },
  {
    id: 'email-22',
    text: `Bonjour Arnaud,

Content de voir que c'est de nouveau vous qui êtes responsable de la gestion de l'immeuble d'Enticy.

Voici donc plusieurs questions que nous avons concernant les changement des de gestionnaire :

On aimerait savoir quel est la raison du changement de gestionnaire de l'immeuble?

À quoi serve tous les frais qui sont mentionné dans votre document et à qui vont-ils? (Frais d'ascenseur, manette, puce, etc.) Les gens ne voudront pas payer 250$ de frais simplement pour réserver l'ascenseur pour déménager…

Comment est-ce que ce changement va affecter nos frais de condos?

Qui sont les membres du CA, comment sont-ils choisis, et quand sera la prochaine rencontre des co-propriétaires?

Qu'est-ce qui sera fait pour augmenter et assurer la sécurité des résidents de l'immeuble?

Comment est-ce que nos locataires peuvent contacter le garde de sécurité lorsqu'ils se sentent en danger de sortir dans le corridor? Ce n'est pas rare qu'ils nous disent qu'ils entendent crier dans le corridor et des batailles. Il est impératif que nos locataires se sentent en sécurité et qu'il n'aye pas peur de simplement sortir dehors.

Nous continuons constamment à avoir des gens qui se stationnent dans nos cases de stationnement (SS1 4-5-6-7) pour lesquelles nous payons des frais. Qu'est-ce qui peut être fait pour empêcher cela? Est-ce qu'un dispositif qui bloc l'accès peut être installé au sol? Mise à part les rares occasions que moi ou Zack allons là, jusqu'à nouvelle ordre, les 4 cases de stationnement sont supposées toujours être vide.

Merci à toi.`
  },
  {
    id: 'email-23',
    text: `Bonjour,

Oui, sans problème. Je vous ai ajouté sous le nom « Condo 2402 ».

Désormais, lorsqu'une personne sonnera au « Condo 2402 », vous recevrez un appel. Il vous suffira de décrocher et de composer le chiffre 9 sur votre téléphone pour ouvrir la porte d'entrée.

En revanche, seuls les résidents disposant d'une puce peuvent appeler l'ascenseur, pour des raisons de sécurité.

N'hésitez pas si vous avez la moindre question. Merci et belle journée !`
  },
  {
    id: 'email-24',
    text: `514-237-3369, mais est ce possible de juste mettre le numéro de condo et pas de nom svp c'est important`
  },
  {
    id: 'email-25',
    text: `Bonjour,

Si vous êtes locataire, la demande doit normalement être effectuée au copropriétaire. La compagnie de gestion ne peut traiter que les demandes provenant des copropriétaires.

Quel numéro de téléphone souhaitez-vous que je communique ?

Merci d'avance.`
  },
  {
    id: 'email-26',
    text: `Bonjour!

Je voudrais faire une demande de buzzer pour le condo 2402, j'habite la ça fait quelques moi mais le buzzer n'as jamais été connecté, merci!`
  },
  {
    id: 'email-27',
    text: `Hi Arnaud,

Here are a few follow-up items that the board needs clarity on:

1. Unit 2303 – Eviction The tenant requested to meet with the board, but we have declined. This needs to be communicated to the tenant. The owner recently became involved, but the board still wishes to proceed with eviction. Please also follow up with security — former guard Joel dealt directly with this tenant and their friends. They often entered the building without a FOB by following residents into the elevator. These incidents were reported multiple times.

2. Unit 1907 – We need to address the ongoing safety concerns in the building. There has been a serious allegation involving a tenant, and the board's position is that this tenant must be removed from the property as soon as possible. Additionally, there was a domestic dispute reported in Unit 1905 earlier this summer involving the tenants on that floor.

3. HVAC Lawsuit – Update ASAP

2. Credit Card Application We need a credit card for the syndicate. Please let us know how we can obtain one as soon as possible.

3. Outstanding Payments to Suppliers When can we start approving and processing invoices? Do you have access to banking and Otoman?

4. Christmas/Holiday Lights Please confirm the timeline for installing the holiday lights.

5. Pool and Garage Painting

* Please obtain a quote for repainting the pool and pool deck (Spring 2026). We need quotes for this work.

* For the garage floor, we'd like to gather 3–4 supplier quotes.

6. Window Washing The townhouse section was not completed, and Ascentia missed the October meeting. Please follow up on this, introduce yourself again, and include me in the email.

7. Gym Purchases

* From Club Piscine: floor mats for the new dumbbell rack (Omnia).

* From Etsy: Sarah sent links for the yoga mat wall holders and 30-inch exercise balls — do you still have these links to purchase these items?

8. Security

* Do we have a date for the next security meeting? We need to review the winter schedule. We still need weekend coverage should continue from midnight to 6 a.m. on Fridays and Saturdays.

* The security station must remain clear. Guards need access to the breakroom and cleaner's storage area — please ensure they have keys or change the lock.

* Security paperwork still shows Ascentia branding and includes incorrect details. Please update all forms (storage, gym, elevator, etc.) with Velora branding and ensure the resident list is current.

* Guards should also have access to Upperbee and the resident list on the iPad. We need to get everything upgraded.

* Please provide an update on the two A4 plastic holder and signage for the desk that should read: ENTICY SECURITY ON DUTY – 514-679-8946 (Include the same wording in French.)

* We also need a second A4 holder for UBER/Food Delivery signage. Deliveries are often left in the lobby on the floor, sometimes causing spills on the furniture.

9. Cleaner Please schedule an in-person meeting with the cleaner to review duties and expectations. We need access to the breakroom/ storage room.

10. Resident Announcement Please send an email to residents introducing Gestion Velora as the new management company. Explain that the board wanted one dedicated property manager for the building and include your on-site hours (e.g., 10 a.m.–3 p.m.) so residents know when they can reach you inperson.

11. Garage Parking Fobs We received a quote for resetting the garage parking fobs — please confirm if this includes resident fobs as well.

Many thanks, Julie`
  },
  {
    id: 'email-28',
    text: `Hi,

Here's a quick summary of the key information for your move-in:

Moving fees

General move-in/move-out supervision fee (performed by a director or manager): $250 per event

Elevator reservation + supervision: Moves must take place Monday to Saturday, 8:00 a.m. to 6:00 p.m., and must be scheduled at least 15 days in advance.

The $250 fee collected by the condo corporation covers :

the risk of damage or premature wear to the elevator,

potential future repairs,

management and supervision costs related to booking and overseeing the operation.

Fobs

The cost is $50 per fob. I can send you a Square payment link (payable by credit card). Once the payment is received, I'll program the fobs and drop them off at the building in the Expedibox at the earliest opportunity.

Moving day assistance

On the day of your move, we will install the elevator protection pads and be present to supervise and ensure everything runs smoothly.

Intercom

I have added you to the system under the name "R Petros".

From now on, when someone buzzes "R Petros," you will receive a call on your phone. Simply answer the call and press 9 to open the front door.

Please note that only residents with an active fob can call the elevator, for security reasons.

Appliance contacts (for warranty/service) if still under warranty. If not see with Omnia Technologies after sales services.

Oven & dishwasher: Distinctive Appliances → 1-800-361-0799 | commercial@distinctive-online.com

Washer & dryer: Whirlpool → 1-800-807-6777

Feel free to reach out if you have any questions. Thank you and have a great day!`
  },
  {
    id: 'email-29',
    text: `Hello,

We are signing the deed of sale with the notary for possession of the condo 1160 Mackay #1609 on Wednesday, November 26th, 2025.

As per the notary, attached are the required documents.

Following the signing, we have a few questions/requests:

We don't have a specific move in date as furniture will be ordered and delivered according to availability. Is there any notification or process for having a large piece of furniture like a bed delivered using the elevator?

We would like request 3 additional chips/fob access (4 total).

We would like the following name/number added to the intercom

R Petros

• 514-568-4251(1st priority) / 514-295-6509 (if 2 numbers are allowed)

If there are any issues with the appliances within the unit, we would need the order number for the each of the items as well as the contact information/process to address any issues.

This is the information requested for the registry:

Romin Petros/Reshmi Varghese

rpetros@gmail.com/reshmipetros@gmail.com

514-295-6509/514-568-4251

Deed of sale will be sent by the notary

Signed PPA (attached)

Home insurance (attached)

Void cheque (attached)

Thanks,

Romin`
  },
  {
    id: 'email-30',
    text: `Hi Julie,

As agreed, the law firm Kugler Kandestin has contacted the engineering firm Technorm to obtain a quote regarding the HVAC system installed in the buildings of the three affected syndicates.

In parallel, we are gathering documentation demonstrating the numerous malfunctions of the system across the three buildings. We are also awaiting a detailed report from Climactic, the company responsible for maintaining the system for all three syndicates.

As mentioned in my previous email, the mandate given to Technorm, in collaboration with Kugler Kandestin, consists of the following objectives:

Define the problem and assess its extent;

Recommend the necessary corrective measures and estimate their costs;

Analyze the possible legal options, whether through legal action or an amicable settlement.

Regarding possible corrective measures, a representative from Omnia informed me that a technical solution does exist, although it is considered expensive.

It would involve installing an electrical panel on each floor, serving as a dedicated breaker for the HVAC system on that floor. This panel would not be accessible to co-owners and would be controlled exclusively by the maintenance company.

It would be useful to obtain a cost estimate for this alternative in order to determine whether the syndicates would be willing to contribute. However, Omnia has refused to disclose the amount, though Technorm could eventually provide an evaluation.

Furthermore, a technician from ITC Technologie, which performs system maintenance on behalf of Daikin, confirmed to me that Omnia initially had the choice between the current two-pipe system and a three-pipe system. The latter would have allowed the independent operation of individual HVAC units, which could have prevented most of the issues currently being experienced.

In conclusion, technical solutions do exist, but it is up to Omnia to demonstrate its willingness to implement the necessary corrections. A legal action will likely prompt them to take action.

Best regards,`
  }
];

export async function POST(req: NextRequest) {
  try {
    const { testAll = false } = await req.json();
    
    const emailsToTest = testAll ? REAL_EMAILS : REAL_EMAILS.slice(0, 3);
    const examples = getExamples(undefined, undefined, 10);
    
    const results = await Promise.all(
      emailsToTest.map(async (email) => {
        try {
          const classification = await classifyEmailHybrid(email.text, examples);
          return {
            emailId: email.id,
            emailPreview: email.text.substring(0, 100) + '...',
            classification: {
              template: classification.template.name,
              templateId: classification.template.id,
              confidence: classification.confidence,
              reasoning: classification.reasoning,
              entities: classification.extractedEntities
            }
          };
        } catch (error: any) {
          return {
            emailId: email.id,
            emailPreview: email.text.substring(0, 100) + '...',
            error: error.message || 'Classification failed'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      totalTested: results.length,
      templates: EMAIL_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description
      }))
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST with { "testAll": true } to test all emails',
    emailCount: REAL_EMAILS.length,
    templates: EMAIL_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description
    }))
  });
}


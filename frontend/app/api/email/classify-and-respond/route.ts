import { NextRequest, NextResponse } from 'next/server';
import { classifyEmailHybrid, classifyEmailRuleBased, EmailClassification } from '@/lib/email-template-classifier';
import { extractPropertyManagementEntities } from '@/lib/email-template-classifier';
import { 
  getDeclarationRule, 
  getViolationRule, 
  getFineAmount,
  getEvictionProcess,
  getMoveDepositInfo,
  getRenovationRequirements,
  requiresBoardApproval,
  formatNotaryCertificateResponse,
  getMoveInOutFees,
  getAccessoryPricing,
  getPoolRules,
  getGymRules,
  getManagementContact,
  formatNewCoOwnerWelcomeMessage,
  getNewCoOwnerRequirements
} from '@/lib/declaration-knowledge';

/**
 * Email Auto-Response System
 * 
 * Receives emails, classifies them, and generates automated responses
 * based on the classification and knowledge base.
 */

interface EmailRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

interface EmailResponse {
  classification: EmailClassification;
  generatedResponse: {
    subject: string;
    body: string;
    html?: string;
    priority: number;
    requiresHumanReview: boolean;
  };
  metadata: {
    processingTime: number;
    confidence: number;
    templateUsed: string;
  };
}

/**
 * Generate response based on email classification
 */
async function generateEmailResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): Promise<{ subject: string; body: string; html?: string; priority: number; requiresHumanReview: boolean }> {
  const template = classification.template;
  const entities = classification.extractedEntities;
  
  // Extract key information
  const unitMatch = originalEmail.body.match(/unit[ée]\s*#?\s*(\d{4})/i) || 
                    originalEmail.body.match(/unité\s*#?\s*(\d{4})/i) ||
                    entities.locations?.find(loc => /\d{4}/.test(loc));
  const unitNumber: string | null = unitMatch ? (unitMatch[1] || unitMatch[0].match(/\d{4}/)?.[0] || null) : null;
  
  // Generate response based on template
  let responseSubject = '';
  let responseBody = '';
  let requiresHumanReview = false;
  
  switch (template.id) {
    case 'water-damage-incident':
      responseSubject = unitNumber 
        ? `Re: Dégât d'eau - Unité ${unitNumber} - Suivi du dossier`
        : `Re: ${originalEmail.subject}`;
      responseBody = generateWaterDamageResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.7 || (entities.amounts?.length ?? 0) > 0;
      break;
      
    case 'eviction-request':
      responseSubject = unitNumber
        ? `Re: Éviction - Unité ${unitNumber} - Suivi`
        : `Re: ${originalEmail.subject}`;
      responseBody = generateEvictionResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = true; // Always review eviction responses
      break;
      
    case 'regulation-violation':
      responseSubject = unitNumber
        ? `Re: Infraction aux règlements - Unité ${unitNumber}`
        : `Re: ${originalEmail.subject}`;
      responseBody = generateViolationResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.8;
      break;
      
    case 'renovation-request':
      responseSubject = `Re: Demande de rénovation${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateRenovationResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.75;
      break;
      
    case 'move-in-out-request':
      responseSubject = `Re: Déménagement${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateMoveInOutResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = false;
      break;
      
    case 'customer-request':
      responseSubject = `Re: ${originalEmail.subject}`;
      responseBody = generateCustomerRequestResponse(classification, originalEmail);
      requiresHumanReview = classification.confidence < 0.6;
      break;
      
    case 'work-building':
      responseSubject = `Re: Travaux requis${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateWorkBuildingResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.7;
      break;
      
    case 'access-control-request':
      responseSubject = `Re: Demande d'intercom/buzzer${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateAccessControlResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = false;
      break;
      
    case 'vendor-payment-request':
      responseSubject = `Re: Configuration paiement fournisseur${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateVendorPaymentResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.75;
      break;
      
    case 'financial-report':
      responseSubject = `Re: ${originalEmail.subject}`;
      responseBody = generateFinancialReportResponse(classification, originalEmail);
      requiresHumanReview = classification.confidence < 0.7;
      break;
      
    case 'legal-document-request':
    case 'notary-document':
      responseSubject = `Re: Certificat de copropriété (Loi 16)${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateLegalDocumentResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = false; // Template-based response
      break;
      
    case 'late-payment-followup':
      responseSubject = unitNumber
        ? `Re: Rappel paiement - Unité ${unitNumber}`
        : `Re: ${originalEmail.subject}`;
      responseBody = generateLatePaymentResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.8;
      break;
      
    case 'supplier-work-followup':
      responseSubject = `Re: Suivi travaux${unitNumber ? ` - Unité ${unitNumber}` : ''}`;
      responseBody = generateSupplierWorkResponse(classification, originalEmail, unitNumber);
      requiresHumanReview = classification.confidence < 0.75;
      break;
      
    case 'weekly-board-update':
      responseSubject = `Re: Mise à jour hebdomadaire - Conseil d'Administration`;
      responseBody = generateWeeklyBoardUpdateResponse(classification, originalEmail);
      requiresHumanReview = false; // Automated weekly updates
      break;
      
    case 'mensual-report':
      responseSubject = `Re: Rapport mensuel`;
      responseBody = generateMonthlyReportResponse(classification, originalEmail);
      requiresHumanReview = false;
      break;
      
    default:
      responseSubject = `Re: ${originalEmail.subject}`;
      responseBody = generateGenericResponse(classification, originalEmail);
      requiresHumanReview = true;
  }
  
  return {
    subject: responseSubject,
    body: responseBody,
    priority: template.priority,
    requiresHumanReview
  };
}

// Template response generators
function generateWaterDamageResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const entities = classification.extractedEntities;
  const hasPhotos = originalEmail.body.toLowerCase().includes('photo') || 
                    (originalEmail.attachments?.length ?? 0) > 0;
  
  return `Bonjour,

Nous avons bien reçu votre courriel concernant le dégât d'eau${unitNumber ? ` dans l'unité ${unitNumber}` : ''}.

${hasPhotos ? 'Nous avons bien reçu les photos jointes et les avons transmises à notre équipe pour évaluation.\n\n' : ''}${(entities.dates?.length ?? 0) > 0 ? `Nous notons que l'incident s'est produit ${entities.dates![0]}.\n\n` : ''}Notre équipe va examiner votre dossier et vous contactera dans les meilleurs délais pour planifier les travaux de réparation nécessaires.

${(entities.amounts?.length ?? 0) > 0 ? `Concernant les montants mentionnés, notre expert en sinistre évaluera les coûts et coordonnera avec l'assurance du syndicat.\n\n` : ''}Si vous avez des questions urgentes, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateEvictionResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const evictionProcess = getEvictionProcess();
  const evictionRule = getDeclarationRule('eviction');
  
  return `Bonjour,

Nous avons bien reçu votre courriel concernant l'éviction${unitNumber ? ` de l'unité ${unitNumber}` : ''}.

Conformément à la déclaration de copropriété et aux lois québécoises, voici le processus qui sera suivi :

Processus d'éviction :
1. Avertissements écrits : ${evictionProcess.noticesRequired} avis(s) formel(s) sera(ont) émis
2. Période de grâce : ${evictionProcess.gracePeriod} pour départ volontaire
3. Application au TAL : Si le locataire ne quitte pas volontairement, une demande d'éviction sera déposée auprès du Tribunal administratif du logement (TAL)
4. Délai du TAL : ${evictionProcess.TALTimeline} pour l'audience après le dépôt de la demande

Responsabilité du copropriétaire :
Conformément à la déclaration de copropriété, les copropriétaires sont responsables du comportement de leurs locataires et invités. Des amendes continueront d'être appliquées au compte du copropriétaire pour chaque nouvelle violation.

Ce dossier nécessite une attention particulière et sera traité selon les procédures légales en vigueur. Notre équipe juridique examine actuellement le dossier et vous contactera sous peu avec les prochaines étapes.

Pour toute question urgente concernant ce dossier, veuillez nous contacter directement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateViolationResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  const isSmokingViolation = emailBody.includes('smoking') ||
                             emailBody.includes('smoke') ||
                             emailBody.includes('fumer') ||
                             emailBody.includes('cigarette');
  
  const wasCaught = emailBody.includes('caught') ||
                    emailBody.includes('attrapé') ||
                    emailBody.includes('security') ||
                    emailBody.includes('sécurité');
  
  const mentionsTime = emailBody.includes('last night') ||
                       emailBody.includes('hier soir') ||
                       emailBody.includes('yesterday') ||
                       entities.dates && entities.dates.length > 0;
  
  if (isSmokingViolation && wasCaught && unitNumber) {
    const smokingRule = getViolationRule('smoking');
    const firstFine = getFineAmount('smoking', 1);
    const secondFine = getFineAmount('smoking', 2);
    const thirdFine = getFineAmount('smoking', 3);
    
    return `Bonjour,

Nous avons bien reçu votre signalement concernant l'infraction de fumer${unitNumber ? ` dans l'unité ${unitNumber}` : ''}${mentionsTime ? ' signalée hier soir' : ''}.

Conformément à la déclaration de copropriété et aux règlements de l'immeuble, le fumer est interdit dans les unités, balcons et parties communes. Nous procéderons à l'examen de cette situation et appliquerons les mesures appropriées, incluant l'émission d'une amende de ${firstFine} pour cette première infraction.

Le copropriétaire de l'unité concernée sera informé de cette infraction et des conséquences possibles en cas de récidive :
- Première infraction : ${firstFine}
- Deuxième infraction : ${secondFine}
- Infractions supplémentaires : ${thirdFine}
- Violations continues : ${(smokingRule && 'escalation' in smokingRule && smokingRule.escalation?.continuousViolation) || '$50 par jour après le premier avis'}

En cas de violations répétées malgré les avertissements, le Conseil d'Administration pourra procéder à une demande d'éviction auprès du Tribunal administratif du logement (TAL).

Merci de votre signalement pour maintenir la qualité de vie et la sécurité dans notre immeuble.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre signalement concernant une infraction aux règlements${unitNumber ? ` dans l'unité ${unitNumber}` : ''}.

Conformément à la déclaration de copropriété, nous procéderons à l'examen de cette situation et prendrons les mesures appropriées. Vous recevrez un suivi dans les prochains jours ouvrables.

Merci de votre collaboration pour maintenir la qualité de vie dans notre immeuble.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateRenovationResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const requirements = getRenovationRequirements();
  const needsBoardApproval = requiresBoardApproval('renovation');
  
  return `Bonjour,

Nous avons bien reçu votre demande de rénovation${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.

Votre demande a été enregistrée dans notre système de gestion. Conformément à la déclaration de copropriété, voici les informations importantes :

Documents requis :
${requirements.documents.map(doc => `- ${doc}`).join('\n')}

${requirements.deposit ? `Dépôt de garantie : Un dépôt de garantie remboursable sera requis avant le début des travaux pour protéger les parties communes. Le montant sera déterminé selon l'ampleur des travaux.` : ''}

${needsBoardApproval ? `Approbation du Conseil d'Administration : Votre projet nécessitera l'approbation du Conseil d'Administration avant de pouvoir procéder.` : ''}

Heures de travail autorisées : Lundi au vendredi, 8 h à 18 h

Notre équipe examinera votre demande et vous contactera sous peu pour vous informer des prochaines étapes.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateMoveInOutResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const fees = getMoveInOutFees();
  const moveRule = getDeclarationRule('moveInOut');
  const emailBody = originalEmail.body.toLowerCase();
  
  // Check if they're asking about fees specifically
  const asksAboutFees = emailBody.includes('fee') || 
                        emailBody.includes('frais') || 
                        emailBody.includes('cost') || 
                        emailBody.includes('coût') ||
                        emailBody.includes('deposit') ||
                        emailBody.includes('dépôt');
  
  return `Bonjour,

Nous avons bien reçu votre demande de déménagement${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.

Conformément à la déclaration de copropriété et au guide de bienvenue, voici les informations importantes :

Avis préalable requis : ${fees.advanceNotice} avant la date de déménagement prévue. Veuillez nous envoyer votre demande à info@gestionvelora.com avec les dates et heures souhaitées.

${asksAboutFees ? `Frais de déménagement :
- Frais d'ascenseur : ${fees.elevatorFee}
- Dépôt de garantie : ${fees.damageDeposit} (entièrement remboursable)

` : ''}Confirmation requise : Le déménagement doit être confirmé et approuvé par la gestion avant de procéder. Les déménagements non autorisés peuvent entraîner des amendes.

Heures autorisées : ${moveRule?.hours || 'Lundi au samedi, 8 h à 18 h'}

Réservation d'ascenseur : Requis pour éviter les conflits d'horaire

Protection des parties communes : Il est impératif de protéger adéquatement les corridors, murs et ascenseur lors du déménagement. Une inspection avant et après sera effectuée. Le dépôt de garantie vous sera restitué dans les 10 jours suivant le déménagement si aucun dommage n'est constaté.

Nous vous confirmerons les dates et heures disponibles dans les prochains jours ouvrables.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateCustomerRequestResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  // Check if this is a new co-owner registration
  const isNewCoOwner = emailBody.includes('nouveau') ||
                        emailBody.includes('new') ||
                        emailBody.includes('achat') ||
                        emailBody.includes('purchase') ||
                        emailBody.includes('prise de possession') ||
                        emailBody.includes('possession date') ||
                        emailBody.includes('nouveau copropriétaire') ||
                        emailBody.includes('new co-owner') ||
                        originalEmail.subject.toLowerCase().includes('nouveau') ||
                        originalEmail.subject.toLowerCase().includes('new');
  
  // Extract possession date if mentioned
  const possessionDate = entities.dates?.[0] || 
                          emailBody.match(/(prise de possession|possession date|date.*possession).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[2];
  
  // Extract unit number
  const unitMatch = originalEmail.body.match(/unit[ée]\s*#?\s*(\d{4})/i) || 
                    originalEmail.body.match(/unité\s*#?\s*(\d{4})/i) ||
                    entities.locations?.find(loc => /\d{4}/.test(loc));
  const unitNumber = unitMatch ? (unitMatch[1] || unitMatch[0].match(/\d{4}/)?.[0]) : null;
  
  if (isNewCoOwner) {
    return formatNewCoOwnerWelcomeMessage(unitNumber || undefined, possessionDate);
  }
  
  return `Bonjour,

Nous avons bien reçu votre demande et nous vous remercions de nous avoir contactés.

Notre équipe examine votre demande et vous répondra dans les meilleurs délais. Si votre demande est urgente, n'hésitez pas à nous appeler directement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateWorkBuildingResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  // Check if this is about plumbing/drain/toilet issues
  const isPlumbing = emailBody.includes('toilet') ||
                     emailBody.includes('toilettes') ||
                     emailBody.includes('bouché') ||
                     emailBody.includes('blocked') ||
                     emailBody.includes('drain') ||
                     emailBody.includes('drainage') ||
                     emailBody.includes('débouchage') ||
                     emailBody.includes('plombier') ||
                     emailBody.includes('plumber') ||
                     emailBody.includes('colonne') ||
                     emailBody.includes('column');
  
  const isDrainCleaning = emailBody.includes('nettoyage') ||
                          emailBody.includes('cleaning') ||
                          emailBody.includes('drain') ||
                          emailBody.includes('drainage');
  
  const isRecurring = emailBody.includes('récurrent') ||
                      emailBody.includes('recurring') ||
                      emailBody.includes('répétition') ||
                      emailBody.includes('répétés') ||
                      emailBody.includes('multiple') ||
                      emailBody.includes('plusieurs fois');
  
  // Check if this is about responsibility/cost question
  const isResponsibilityQuestion = emailBody.includes('responsibility') ||
                                   emailBody.includes('responsabilité') ||
                                   emailBody.includes('owner') ||
                                   emailBody.includes('copropriétaire') ||
                                   emailBody.includes('building management') ||
                                   emailBody.includes('gestion') ||
                                   emailBody.includes('fee') ||
                                   emailBody.includes('cost') ||
                                   emailBody.includes('frais') ||
                                   emailBody.includes('coût');
  
  // Check if it's HVAC/heating specific
  const isHVAC = emailBody.includes('heating') ||
                 emailBody.includes('chauffage') ||
                 emailBody.includes('hvac') ||
                 emailBody.includes('air conditioning') ||
                 emailBody.includes('climatisation') ||
                 emailBody.includes('ventilation') ||
                 emailBody.includes('thermostat');
  
  // Check if it's inside unit vs common areas
  const mentionsInsideUnit = emailBody.includes('inside') ||
                             emailBody.includes('dans l\'unité') ||
                             emailBody.includes('dans votre unité') ||
                             emailBody.includes('your unit');
  
  const mentionsCommonAreas = emailBody.includes('common areas') ||
                              emailBody.includes('parties communes') ||
                              emailBody.includes('central') ||
                              emailBody.includes('centrale');
  
  // Handle plumbing/drain cleaning requests
  if (isPlumbing && (isDrainCleaning || isRecurring)) {
    const asksForDate = emailBody.includes('date') ||
                        emailBody.includes('dernier') ||
                        emailBody.includes('last') ||
                        emailBody.includes('quand') ||
                        emailBody.includes('when');
    
    return `Bonjour,

Nous avons bien reçu votre demande concernant le problème récurrent de toilettes bouchées${unitNumber ? ` dans l'unité ${unitNumber}` : ''}${entities.locations && entities.locations.length > 1 ? ` et ${entities.locations.filter(l => l !== unitNumber).join(', ')}` : ''}.

Nous comprenons la frustration causée par ce problème récurrent. Notre équipe de maintenance va procéder à une inspection complète de la colonne de plomberie concernée et effectuer un nettoyage approfondi du drain pour prévenir tout risque de refoulement.${asksForDate ? '\n\nNous vérifierons les registres pour vous confirmer la date du dernier nettoyage de drain effectué dans l\'immeuble et vous informerons sous peu.' : ''}

De plus, nous allons rappeler à tous les résidents l'importance de ne rien jeter dans les toilettes pour prévenir ce type de problème.

Nous vous contacterons dans les prochains jours ouvrables pour planifier l'intervention et vous tenir informé de l'avancement.

Merci de votre collaboration.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isResponsibilityQuestion && isHVAC) {
    if (mentionsInsideUnit || (!mentionsCommonAreas && unitNumber)) {
      return `Bonjour,

Nous avons bien reçu votre demande concernant le système de chauffage/ventilation${unitNumber ? ` dans l'unité ${unitNumber}` : ''}.

Conformément à la déclaration de copropriété, les réparations nécessaires à l'intérieur de votre unité ou qui concernent uniquement votre unité sont à la charge du copropriétaire.

Si le problème concerne les parties communes ou le système centralisé, le syndicat en assume la responsabilité. Pour déterminer la source exacte du problème, nous recommandons une inspection par un technicien qualifié.

Notre équipe peut vous aider à coordonner une inspection si nécessaire. Veuillez nous indiquer si vous souhaitez que nous programmions une visite.

Cordialement,
L'équipe de gestion
Gestion Velora`;
    } else if (mentionsCommonAreas) {
      return `Bonjour,

Nous avons bien reçu votre demande concernant le système de chauffage/ventilation${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.

Si le problème concerne les parties communes ou le système centralisé, le syndicat en assume la responsabilité. Notre équipe de maintenance va examiner votre demande et planifier une inspection si nécessaire.

Pour les systèmes à l'intérieur de votre unité, la responsabilité incombe au copropriétaire conformément à la déclaration de copropriété.

Nous vous contacterons sous peu pour planifier une inspection afin de déterminer la source exacte du problème.

Cordialement,
L'équipe de gestion
Gestion Velora`;
    }
  }
  
  if (isHVAC && !isResponsibilityQuestion) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant le système de chauffage/ventilation${unitNumber ? ` dans l'unité ${unitNumber}` : ''}.

Notre équipe de maintenance va examiner votre demande et vous contactera pour planifier une visite d'inspection si nécessaire. 

Conformément à la déclaration de copropriété, les problèmes dans les parties communes ou les systèmes centralisés sont de la responsabilité du syndicat, tandis que les réparations à l'intérieur de votre unité sont à la charge du copropriétaire.

Les travaux seront planifiés selon les priorités et la disponibilité de nos entrepreneurs.

Merci de votre patience.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  // Handle plumbing/drain cleaning requests
  if (isPlumbing && (isDrainCleaning || isRecurring)) {
    const asksForDate = emailBody.includes('date') ||
                        emailBody.includes('dernier') ||
                        emailBody.includes('last') ||
                        emailBody.includes('quand') ||
                        emailBody.includes('when');
    
    return `Bonjour,

Nous avons bien reçu votre demande concernant le problème récurrent de toilettes bouchées${unitNumber ? ` dans l'unité ${unitNumber}` : ''}${entities.locations && entities.locations.length > 1 ? ` et ${entities.locations.filter(l => l !== unitNumber).join(', ')}` : ''}.

Nous comprenons la frustration causée par ce problème récurrent. Notre équipe de maintenance va procéder à une inspection complète de la colonne de plomberie concernée et effectuer un nettoyage approfondi du drain pour prévenir tout risque de refoulement.${asksForDate ? '\n\nNous vérifierons les registres pour vous confirmer la date du dernier nettoyage de drain effectué dans l\'immeuble et vous informerons sous peu.' : ''}

De plus, nous allons rappeler à tous les résidents l'importance de ne rien jeter dans les toilettes pour prévenir ce type de problème.

Nous vous contacterons dans les prochains jours ouvrables pour planifier l'intervention et vous tenir informé de l'avancement.

Merci de votre collaboration.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre demande concernant des travaux${unitNumber ? ` dans l'unité ${unitNumber}` : ''}.

Notre équipe de maintenance va examiner votre demande et vous contactera pour planifier une visite d'inspection si nécessaire. Les travaux seront ensuite planifiés selon les priorités et la disponibilité de nos entrepreneurs.

Merci de votre patience.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateAccessControlResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const entities = classification.extractedEntities;
  const emailBody = originalEmail.body.toLowerCase();
  const hasPhoneNumber = (entities.phoneNumbers?.length ?? 0) > 0;
  const phoneNumber = hasPhoneNumber ? entities.phoneNumbers![0] : null;
  
  // Check if this is about package/locker issues
  const isPackageIssue = emailBody.includes('colis') ||
                         emailBody.includes('package') ||
                         emailBody.includes('locker') ||
                         emailBody.includes('casier') ||
                         emailBody.includes('expedibox') ||
                         emailBody.includes('box') ||
                         emailBody.includes('boite');
  
  const needsRegistration = emailBody.includes('enregistré') ||
                           emailBody.includes('registered') ||
                           emailBody.includes('enregistrer') ||
                           emailBody.includes('registration') ||
                           emailBody.includes('pas encore') ||
                           emailBody.includes('not yet') ||
                           emailBody.includes('toujours pas');
  
  const hasPackageCodeIssue = emailBody.includes('code') &&
                              (emailBody.includes('ancien') ||
                               emailBody.includes('old') ||
                               emailBody.includes('précédent') ||
                               emailBody.includes('previous') ||
                               emailBody.includes('locataire') ||
                               emailBody.includes('tenant'));
  
  // Check if this is a follow-up request (modification, name change, etc.)
  const isFollowUp = emailBody.includes('modifier') ||
                     emailBody.includes('changer') ||
                     emailBody.includes('mettre') ||
                     emailBody.includes('juste') ||
                     emailBody.includes('seulement') ||
                     originalEmail.subject.toLowerCase().includes('re:');
  
  const wantsNameChange = emailBody.includes('nom') &&
                          (emailBody.includes('pas') ||
                           emailBody.includes('juste') ||
                           emailBody.includes('seulement'));
  
  // Handle package/locker registration issues
  if (isPackageIssue && (needsRegistration || hasPackageCodeIssue)) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant${unitNumber ? ` l'unité ${unitNumber}` : ' votre unité'}.

Concernant votre colis dans les casiers, nous pouvons vous aider à récupérer votre colis même s'il est enregistré à l'ancienne locataire. Veuillez nous contacter directement par téléphone ou venir au bureau de gestion avec une pièce d'identité pour que nous puissions vous donner accès à votre colis.

Pour votre enregistrement dans le système (intercom et casiers), nous allons procéder à votre inscription dès que possible.${phoneNumber ? ` Nous avons noté votre numéro de téléphone (${phoneNumber}) pour la configuration.` : ' Pour compléter votre enregistrement, nous aurons besoin de votre numéro de téléphone.'}

${phoneNumber ? '' : 'Veuillez nous fournir votre numéro de téléphone pour que nous puissions vous enregistrer dans le système.\n\n'}Une fois l'enregistrement terminé, vous recevrez les codes d'accès pour les casiers et votre intercom sera configuré.

Si vous avez des questions urgentes, n'hésitez pas à nous contacter directement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isFollowUp && wantsNameChange) {
    return `Bonjour,

Nous avons bien noté votre demande de modification${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.

Nous allons modifier l'affichage pour n'afficher que le numéro de condo${unitNumber ? ` (${unitNumber})` : ''} sans nom, comme demandé.${phoneNumber ? ` Votre numéro de téléphone (${phoneNumber}) reste enregistré pour l'intercom.` : ''}

La modification sera effectuée dans les prochains jours ouvrables et vous recevrez une confirmation une fois terminée.

Si vous avez d'autres questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isFollowUp && phoneNumber) {
    return `Bonjour,

Nous avons bien reçu votre demande de modification${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.${phoneNumber ? ` Nous avons noté votre numéro de téléphone (${phoneNumber}).` : ''}

Notre équipe va procéder à la mise à jour de la configuration dans les prochains jours ouvrables.

Une fois la modification terminée, vous recevrez une confirmation par courriel.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre demande de configuration d'intercom/buzzer${unitNumber ? ` pour l'unité ${unitNumber}` : ''}.

Notre équipe va procéder à la configuration de votre intercom dans les prochains jours ouvrables.${phoneNumber ? ` Nous avons noté votre numéro de téléphone (${phoneNumber}) pour la configuration.` : ' Pour compléter la configuration, nous aurons besoin de votre numéro de téléphone.'}

${phoneNumber ? '' : 'Veuillez nous fournir votre numéro de téléphone pour que nous puissions connecter votre buzzer.\n\n'}Une fois la configuration terminée, vous recevrez une confirmation par courriel.

Si vous avez des questions ou des besoins urgents, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateVendorPaymentResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  const needsVoidCheque = emailBody.includes('void cheque') ||
                          emailBody.includes('specimen') ||
                          emailBody.includes('chèque') ||
                          emailBody.includes('cheque') ||
                          emailBody.includes('spécimen');
  
  const needsBillingAddress = emailBody.includes('billing address') ||
                             emailBody.includes('adresse de facturation') ||
                             emailBody.includes('adresse facturation') ||
                             emailBody.includes('nouvelle adresse') ||
                             emailBody.includes('new address');
  
  const needsBoardApproval = emailBody.includes('board approval') ||
                            emailBody.includes('approbation conseil') ||
                            emailBody.includes('conseil administration') ||
                            emailBody.includes('CA') ||
                            emailBody.includes('approuve');
  
  const isNewCompany = emailBody.includes('nouvelle compagnie') ||
                       emailBody.includes('new company') ||
                       emailBody.includes('nouveau fournisseur') ||
                       emailBody.includes('new vendor');
  
  if (needsVoidCheque || needsBillingAddress || isNewCompany) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant la configuration du paiement${isNewCompany ? ' pour la nouvelle compagnie' : ''}.

Pour procéder au paiement des factures${needsBoardApproval ? ' une fois que le Conseil d\'Administration du syndicat aura approuvé la facture' : ''}, nous avons besoin des informations suivantes :

${needsVoidCheque ? '• Un chèque annulé (specimen cheque) pour configurer le paiement par prélèvement automatique\n' : ''}${needsBillingAddress ? '• La nouvelle adresse de facturation (la compagnie de gestion en charge du syndicat a changé)\n' : ''}
Informations de facturation requises :
• Nom du client : SDC Entity A/C Velora immobilier inc.
• Adresse : 1160 Mackay, Montréal H3G 0G8
• Adresse de facturation : Velora immobilier inc., 3181 Mnt Saint-Hubert, Saint-Hubert J3Y 4J4

${needsVoidCheque ? 'Veuillez nous faire parvenir votre chèque annulé par courriel à info@gestionvelora.com ou par la poste à l\'adresse ci-dessus.\n\n' : ''}Une fois ces informations reçues${needsBoardApproval ? ' et la facture approuvée par le CA' : ''}, nous procéderons à la configuration du paiement.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre demande concernant le paiement fournisseur.

Notre équipe va examiner votre demande et vous contactera pour obtenir les informations nécessaires (chèque annulé, adresse de facturation, etc.) afin de procéder au paiement.

Merci de votre patience.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateFinancialReportResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  const isPPARequest = emailBody.includes('ppa') ||
                       emailBody.includes('paiement préautorisé') ||
                       emailBody.includes('pre-authorized') ||
                       emailBody.includes('préautorisé');
  
  const isCondoFees = emailBody.includes('frais de condo') ||
                      emailBody.includes('condo fees') ||
                      emailBody.includes('frais copropriété') ||
                      emailBody.includes('charges communes');
  
  const isNewOwner = emailBody.includes('nouveau propriétaire') ||
                     emailBody.includes('new owner') ||
                     emailBody.includes('futur propriétaire') ||
                     emailBody.includes('future owner') ||
                     emailBody.includes('date d\'achat') ||
                     emailBody.includes('purchase date');
  
  const isLatePayment = emailBody.includes('late') ||
                        emailBody.includes('retard') ||
                        emailBody.includes('overdue') ||
                        emailBody.includes('souffrance') ||
                        emailBody.includes('arrears') ||
                        emailBody.includes('arrérages') ||
                        emailBody.includes('past due') ||
                        emailBody.includes('impayé');
  
  const asksAboutAmount = emailBody.includes('montant') ||
                          emailBody.includes('amount') ||
                          emailBody.includes('combien') ||
                          emailBody.includes('how much') ||
                          (entities.amounts?.length ?? 0) > 0;
  
  // Handle late payment scenarios
  if (isLatePayment && isCondoFees) {
    const amountDue = entities.amounts?.[0] || '[Montant dû]';
    return `Bonjour,

Nous vous contactons concernant le solde impayé de vos frais de copropriété.

Montant dû: ${amountDue}

Nous vous rappelons que les frais de copropriété sont dus le 1er de chaque mois. Un retard de paiement peut entraîner l'application d'intérêts conformément à la déclaration de copropriété.

Veuillez régulariser votre compte dans les plus brefs délais. Si vous avez déjà effectué le paiement, veuillez ignorer ce message.

Pour configurer le paiement préautorisé (PPA) et éviter tout retard futur, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isNewOwner && (isPPARequest || isCondoFees)) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant le paiement des frais de copropriété${isPPARequest ? ' et le formulaire de paiement préautorisé (PPA)' : ''}.

${isPPARequest ? 'Le formulaire PPA (Paiement Pré-Autorisé) vous sera transmis sous peu. Ce formulaire permet le paiement automatique des charges communes via votre compte bancaire, ce qui évite tout retard de paiement.\n\n' : ''}Concernant les frais de copropriété${asksAboutAmount && entities.amounts ? `, le montant mensuel est de ${entities.amounts[0]}` : ', nous vous confirmerons le montant exact'}.${asksAboutAmount ? ' Ce montant peut être ajusté selon les décisions du Conseil d\'Administration.\n\n' : '\n\n'}Une fois le formulaire PPA rempli et signé, ainsi qu\'un chèque annulé fourni, nous procéderons à la configuration du paiement automatique.

Si vous avez des questions concernant les montants ou la procédure, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isPPARequest) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant le paiement préautorisé (PPA).

Le formulaire PPA vous sera transmis sous peu. Pour compléter la configuration, nous aurons besoin :
• Du formulaire PPA rempli et signé
• D'un chèque annulé (specimen cheque)

Une fois ces documents reçus, nous procéderons à la configuration du paiement automatique des charges communes.

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isCondoFees && asksAboutAmount) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant les frais de copropriété.

${(entities.amounts?.length ?? 0) > 0 ? `Le montant mensuel des frais de copropriété est de ${entities.amounts![0]}. ` : 'Nous vous confirmerons le montant exact des frais de copropriété sous peu. '}Ce montant peut être ajusté selon les décisions du Conseil d'Administration.

Si vous avez des questions concernant les frais ou le paiement, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre demande concernant les aspects financiers.

Notre équipe comptable examine votre demande et vous répondra dans les meilleurs délais avec les informations demandées.

Si votre demande concerne une facture ou un paiement spécifique, veuillez nous fournir les détails (numéro de facture, montant, date) pour accélérer le traitement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateLegalDocumentResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  // Extract unit-specific information from email
  const unitMatch = originalEmail.body.match(/unit[ée]\s*#?\s*(\d{4})/i) || 
                    originalEmail.body.match(/unité\s*#?\s*(\d{4})/i) ||
                    originalEmail.body.match(/lot\s*#?\s*(\d{4})/i) ||
                    entities.locations?.find(loc => /\d{4}/.test(loc));
  const extractedUnitNumber = unitMatch ? (unitMatch[1] || unitMatch[0].match(/\d{4}/)?.[0]) : unitNumber;
  
  // Extract condo fees amount
  const condoFeesMatch = originalEmail.body.match(/frais.*condo.*?(\$?\d+[.,]\d{2})/i) ||
                        originalEmail.body.match(/condo.*fees.*?(\$?\d+[.,]\d{2})/i) ||
                        entities.amounts?.find(amt => amt.includes('$'));
  const condoFees = condoFeesMatch ? condoFeesMatch[1] : undefined;
  
  // Extract next payment date
  const dateMatch = entities.dates?.[0] || 
                    originalEmail.body.match(/(prochain|next).*paiement.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const nextPaymentDate = dateMatch ? (dateMatch[2] || dateMatch[0]) : undefined;
  
  // Extract amount due
  const amountDueMatch = originalEmail.body.match(/montant.*dû.*?(\$?\d+[.,]\d{2})/i) ||
                         originalEmail.body.match(/amount.*due.*?(\$?\d+[.,]\d{2})/i) ||
                         originalEmail.body.match(/solde.*?(\$?\d+[.,]\d{2})/i);
  const amountDue = amountDueMatch ? amountDueMatch[1] : undefined;
  
  // Check if this is a Law 16 certificate request
  const isLaw16Request = emailBody.includes('law 16') ||
                         emailBody.includes('loi 16') ||
                         emailBody.includes('certificat') ||
                         emailBody.includes('certificate') ||
                         emailBody.includes('attestation') ||
                         emailBody.includes('notary') ||
                         emailBody.includes('notaire');
  
  if (isLaw16Request) {
    return formatNotaryCertificateResponse(
      extractedUnitNumber || undefined,
      condoFees,
      nextPaymentDate,
      amountDue
    );
  }
  
  // Generic legal document response
  return `Bonjour,

Nous avons bien reçu votre demande de document légal${extractedUnitNumber ? ` pour l'unité ${extractedUnitNumber}` : ''}.

Pour les certificats de copropriété (Loi 16), veuillez nous fournir les informations suivantes :
- Numéro de lot/Unité
- Montant des frais de condo mensuels
- Date du prochain paiement
- Montant dû au compte (le cas échéant)

Les frais administratifs pour l'émission du certificat sont de 225 $.

Une fois ces informations reçues, nous vous ferons parvenir le certificat dans les 5 à 10 jours ouvrables.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateLatePaymentResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  // Extract amount due and days overdue
  const amountDue = entities.amounts?.[0] || '[Montant dû]';
  const daysOverdueMatch = emailBody.match(/(\d+)\s*(?:days?|jours?|mois|months?)\s*(?:overdue|retard|en.*souffrance)/i);
  const daysOverdue = daysOverdueMatch ? daysOverdueMatch[1] : null;
  
  const isFirstReminder = emailBody.includes('premier') || emailBody.includes('first') || !daysOverdue;
  const isFinalNotice = emailBody.includes('dernier') || emailBody.includes('final') || emailBody.includes('dernière');
  
  if (isFinalNotice) {
    return `Bonjour${unitNumber ? ` - Unité ${unitNumber}` : ''},

Nous vous contactons concernant le solde impayé de vos frais de copropriété.

Montant dû: ${amountDue}
${daysOverdue ? `Jours de retard: ${daysOverdue}` : ''}

Ceci constitue un dernier avis avant que des mesures de recouvrement ne soient entreprises, conformément à la déclaration de copropriété.

Nous vous demandons de régulariser votre compte dans les plus brefs délais pour éviter:
- L'application d'intérêts sur les montants en souffrance
- Des frais de recouvrement additionnels
- Des mesures légales si nécessaire

Vous pouvez effectuer le paiement par:
- Paiement préautorisé (PPA) - si déjà configuré
- Chèque postdaté
- Virement bancaire

Veuillez nous contacter immédiatement si vous avez des questions ou si vous souhaitez discuter d'un plan de paiement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isFirstReminder) {
    return `Bonjour${unitNumber ? ` - Unité ${unitNumber}` : ''},

Nous vous contactons concernant le paiement de vos frais de copropriété.

Montant dû: ${amountDue}
${daysOverdue ? `Jours de retard: ${daysOverdue}` : ''}

Nous vous rappelons que les frais de copropriété sont dus le 1er de chaque mois. Un retard de paiement peut entraîner l'application d'intérêts conformément à la déclaration de copropriété.

Veuillez régulariser votre compte dès que possible. Si vous avez déjà effectué le paiement, veuillez ignorer ce message.

Pour toute question concernant votre compte ou pour configurer le paiement préautorisé (PPA), n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour${unitNumber ? ` - Unité ${unitNumber}` : ''},

Nous vous contactons concernant le solde impayé de vos frais de copropriété.

Montant dû: ${amountDue}
${daysOverdue ? `Jours de retard: ${daysOverdue}` : ''}

Nous vous rappelons que les frais de copropriété sont dus le 1er de chaque mois. Un retard de paiement prolongé peut entraîner:
- L'application d'intérêts sur les montants en souffrance
- Des frais de recouvrement additionnels
- Des mesures légales si nécessaire

Veuillez régulariser votre compte dans les plus brefs délais. Si vous avez des difficultés financières, veuillez nous contacter pour discuter d'un plan de paiement.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateSupplierWorkResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest,
  unitNumber: string | null
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  const isInvoiceRequest = emailBody.includes('invoice') || emailBody.includes('facture');
  const isQualityIssue = emailBody.includes('quality') || emailBody.includes('qualité') || emailBody.includes('defect') || emailBody.includes('défaut') || emailBody.includes('deficiency') || emailBody.includes('déficience');
  const isCompletionFollowup = emailBody.includes('completed') || emailBody.includes('terminé') || emailBody.includes('finished') || emailBody.includes('fini');
  const isWarrantyIssue = emailBody.includes('warranty') || emailBody.includes('garantie');
  
  if (isQualityIssue || isWarrantyIssue) {
    return `Bonjour,

Nous avons bien reçu votre suivi concernant${unitNumber ? ` les travaux à l'unité ${unitNumber}` : ' les travaux'}.

Nous comprenons que vous avez identifié${isQualityIssue ? ' des problèmes de qualité ou des déficiences' : ' un problème de garantie'} dans les travaux effectués.

Notre équipe va:
1. Examiner les détails du problème signalé
2. Contacter le fournisseur/entrepreneur concerné
3. Organiser une inspection si nécessaire
4. Coordonner les travaux correctifs

Veuillez nous fournir:
- Des photos des problèmes identifiés (si applicable)
- Une description détaillée des déficiences
- La date de découverte du problème

Nous vous tiendrons informé de l'avancement du dossier.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isInvoiceRequest) {
    return `Bonjour,

Nous avons bien reçu votre demande concernant${unitNumber ? ` les travaux à l'unité ${unitNumber}` : ' les travaux'}.

Concernant la facturation:
- Nous avons bien reçu la facture du fournisseur/entrepreneur
- La facture est en cours de traitement
- Le paiement sera effectué selon les termes convenus

Si vous avez des questions concernant le montant ou les détails de la facture, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  if (isCompletionFollowup) {
    return `Bonjour,

Nous avons bien reçu votre suivi concernant${unitNumber ? ` les travaux à l'unité ${unitNumber}` : ' les travaux'}.

Les travaux ont été complétés. Nous procéderons à:
1. Une inspection finale des travaux effectués
2. La vérification de la conformité avec les spécifications
3. Le traitement de la facture finale une fois l'inspection approuvée

Si vous avez des questions ou des préoccupations concernant les travaux, veuillez nous en informer avant l'inspection finale.

Cordialement,
L'équipe de gestion
Gestion Velora`;
  }
  
  return `Bonjour,

Nous avons bien reçu votre suivi concernant${unitNumber ? ` les travaux à l'unité ${unitNumber}` : ' les travaux avec le fournisseur'}.

Notre équipe examine votre demande et vous répondra dans les meilleurs délais avec les informations demandées concernant le statut des travaux, la facturation, ou toute autre question.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateWeeklyBoardUpdateResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  // Extract key topics from email
  const hasWaterDamage = emailBody.includes('dégât') || emailBody.includes('water damage');
  const hasViolations = emailBody.includes('infraction') || emailBody.includes('violation');
  const hasFinancial = emailBody.includes('financial') || emailBody.includes('financier') || emailBody.includes('budget');
  const hasMaintenance = emailBody.includes('maintenance') || emailBody.includes('travaux') || emailBody.includes('work');
  const hasLegal = emailBody.includes('legal') || emailBody.includes('légal') || emailBody.includes('TAL') || emailBody.includes('eviction');
  
  const weekEnding = entities.dates?.[0] || new Date().toLocaleDateString('fr-CA');
  
  let updateSections: string[] = [];
  
  if (hasWaterDamage) {
    updateSections.push('• Sinistres: Suivi des dossiers de dégâts d\'eau en cours');
  }
  if (hasViolations) {
    updateSections.push('• Infractions: Suivi des infractions aux règlements et application des amendes');
  }
  if (hasFinancial) {
    updateSections.push('• Finances: Suivi des paiements, factures, et budget');
  }
  if (hasMaintenance) {
    updateSections.push('• Entretien: Suivi des travaux et maintenance de l\'immeuble');
  }
  if (hasLegal) {
    updateSections.push('• Légal: Suivi des dossiers TAL, évictions, et procédures légales');
  }
  
  if (updateSections.length === 0) {
    updateSections.push('• Divers: Suivi général des dossiers en cours');
  }
  
  return `MISE À JOUR HEBDOMADAIRE - CONSEIL D'ADMINISTRATION
Semaine terminant le ${weekEnding}

Bonjour membres du Conseil d'Administration,

Voici un résumé des dossiers importants suivis cette semaine:

${updateSections.join('\n')}

SUIVIS IMPORTANTS:
- Dossiers nécessitant une attention particulière du Conseil
- Décisions en attente d'approbation
- Questions nécessitant une discussion lors de la prochaine réunion

PROCHAINES ÉTAPES:
- Réunion du Conseil d'Administration prévue
- Décisions à prendre
- Actions requises

Pour plus de détails sur un dossier spécifique, veuillez consulter le système de gestion ou contacter l'équipe administrative.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateMonthlyReportResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): string {
  const emailBody = originalEmail.body.toLowerCase();
  const entities = classification.extractedEntities;
  
  const monthMatch = emailBody.match(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)/i);
  const month = monthMatch ? monthMatch[1] : new Date().toLocaleDateString('fr-CA', { month: 'long' });
  
  return `RAPPORT MENSUEL - ${month.toUpperCase()}

Bonjour,

Voici le rapport mensuel pour le mois de ${month}:

RÉSUMÉ FINANCIER:
- Revenus: [À compléter]
- Dépenses: [À compléter]
- Solde: [À compléter]

SINISTRES:
- Nouveaux sinistres: [Nombre]
- Sinistres en cours: [Nombre]
- Sinistres clôturés: [Nombre]

TRAVAUX ET MAINTENANCE:
- Travaux complétés: [Liste]
- Travaux en cours: [Liste]
- Travaux planifiés: [Liste]

INFRACTIONS ET SUIVIS:
- Infractions signalées: [Nombre]
- Amendes émises: [Nombre]
- Dossiers résolus: [Nombre]

AUTRES POINTS IMPORTANTS:
- [Points à souligner]

Pour plus de détails, veuillez consulter les rapports détaillés dans le système de gestion.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

function generateGenericResponse(
  classification: EmailClassification,
  originalEmail: EmailRequest
): string {
  return `Bonjour,

Nous avons bien reçu votre courriel et nous vous remercions de nous avoir contactés.

Notre équipe examine votre demande et vous répondra dans les meilleurs délais.

Cordialement,
L'équipe de gestion
Gestion Velora`;
}

/**
 * POST /api/email/classify-and-respond
 * 
 * Receives an email, classifies it, and generates an automated response
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const emailData: EmailRequest = await req.json();
    
    if (!emailData.from || !emailData.body) {
      return NextResponse.json(
        { error: 'Missing required fields: from, body' },
        { status: 400 }
      );
    }
    
    // Combine subject and body for classification
    const emailText = `${emailData.subject || ''}\n\n${emailData.body}`;
    
    // Classify email
    const classification = await classifyEmailHybrid(
      emailText,
      [], // fewShotExamples - can be populated from database
      undefined // llmProvider - can be added if needed
    );
    
    // Generate response
    const generatedResponse = await generateEmailResponse(classification, emailData);
    
    const processingTime = Date.now() - startTime;
    
    const response: EmailResponse = {
      classification,
      generatedResponse,
      metadata: {
        processingTime,
        confidence: classification.confidence,
        templateUsed: classification.template.name
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Email classification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email',
        message: error.message 
      },
      { status: 500 }
    );
  }
}


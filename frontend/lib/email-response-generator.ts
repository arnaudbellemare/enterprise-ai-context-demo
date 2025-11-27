/**
 * Email Response Generator
 * Generates appropriate responses based on email classification and context
 */

import { EmailClassification, EMAIL_TEMPLATES } from './email-template-classifier';
import { TeacherStudentSystem } from './teacher-student-system';

export interface EmailContext {
  classification: EmailClassification;
  conversationHistory?: Array<{ role: string; content: string }>;
  extractedEntities: {
    dates?: string[];
    amounts?: string[];
    locations?: string[];
    people?: string[];
    documents?: string[];
    phoneNumbers?: string[];
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiresAction: boolean;
}

export interface ResponseTemplate {
  templateId: string;
  greeting: string;
  body: string;
  closing: string;
  requiredFields: string[];
  optionalFields: string[];
}

export interface GeneratedResponse {
  subject: string;
  body: string;
  suggestedActions: string[];
  priority: number;
  requiresHumanReview: boolean;
}

/**
 * Response templates for each email type
 */
const RESPONSE_TEMPLATES: Record<string, ResponseTemplate> = {
  'tenant-safety-complaint': {
    templateId: 'tenant-safety-complaint',
    greeting: 'Bonjour {name},\n\n',
    body: `Nous comprenons l'urgence de la situation concernant {unit}. La sécurité de nos résidents est notre priorité absolue.\n\n
Actions immédiates prises :
- Dossier actif au TAL pour expulsion
- Avis formels envoyés au copropriétaire
- Pénalités appliquées systématiquement
- Contact avec la sécurité pour surveillance accrue\n\n
{additionalInfo}\n\n
Nous vous tiendrons informé de l'avancement du dossier.`,
    closing: '\n\nMerci de votre patience.\n\nCordialement,\nGestion Velora',
    requiredFields: ['unit', 'name'],
    optionalFields: ['additionalInfo']
  },
  'legal-document-request': {
    templateId: 'legal-document-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Nous confirmons votre demande de certificat (Loi 16) pour l'unité {unit}.\n\n
Conformément à la Déclaration de copropriété, section 10.3.7.32, nous sommes tenus de fournir ce document dans les 15 jours suivant votre demande.\n\n
Frais administratifs applicables :
- Montant : {amount} par événement (section 14.6.5.3)\n\n
Nous préparerons et enverrons le certificat dès que possible. La facture des frais administratifs vous sera envoyée pour paiement.\n\n
{additionalInfo}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['unit', 'name', 'amount'],
    optionalFields: ['additionalInfo']
  },
  'work-building': {
    templateId: 'work-building',
    greeting: 'Bonjour {name},\n\n',
    body: `Nous avons bien reçu votre demande concernant {issue} dans l'unité {unit}.\n\n
{response}\n\n
{nextSteps}\n\n
Si vous avez d'autres questions, n'hésitez pas à nous contacter.`,
    closing: '\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'unit', 'issue'],
    optionalFields: ['response', 'nextSteps']
  },
  'move-in-out-request': {
    templateId: 'move-in-out-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici un résumé des informations clés pour votre {moveType} :\n\n
Frais de déménagement :
- Frais de supervision générale : {amount} par événement
- Réservation d'ascenseur : Les déménagements doivent avoir lieu du lundi au samedi, de 8 h à 18 h, et être déclarés au moins 15 jours à l'avance\n\n
Fobs :
- Coût : 50 $ par fob
- {fobStatus}\n\n
Intercom :
- {intercomStatus}\n\n
{additionalInfo}`,
    closing: '\n\nN\'hésitez pas si vous avez des questions. Merci et bonne journée !\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'moveType', 'amount'],
    optionalFields: ['fobStatus', 'intercomStatus', 'additionalInfo']
  },
  'access-control-request': {
    templateId: 'access-control-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Oui, sans problème. Je vous ai ajouté sous le nom « {unitName} ».\n\n
Désormais, lorsqu'une personne sonnera au « {unitName} », vous recevrez un appel. Il vous suffira de décrocher et de composer le chiffre 9 sur votre téléphone pour ouvrir la porte d'entrée.\n\n
En revanche, seuls les résidents disposant d'une puce peuvent appeler l'ascenseur, pour des raisons de sécurité.\n\n
{additionalInfo}`,
    closing: '\n\nN\'hésitez pas si vous avez la moindre question. Merci et belle journée !\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'unitName'],
    optionalFields: ['additionalInfo']
  },
  'board-meeting-followup': {
    templateId: 'board-meeting-followup',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici le suivi concernant {topic} :\n\n
{statusUpdate}\n\n
{nextSteps}\n\n
{additionalInfo}`,
    closing: '\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'topic'],
    optionalFields: ['statusUpdate', 'nextSteps', 'additionalInfo']
  },
  'customer-request': {
    templateId: 'customer-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Merci pour votre question concernant {topic}.\n\n
{answer}\n\n
{additionalInfo}`,
    closing: '\n\nN\'hésitez pas si vous avez d\'autres questions.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'topic'],
    optionalFields: ['answer', 'additionalInfo']
  },
  'meeting-request': {
    templateId: 'meeting-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Merci pour votre demande de réunion.\n\n
{availability}\n\n
{meetingDetails}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['availability', 'meetingDetails']
  },
  'schedule-request': {
    templateId: 'schedule-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici l'horaire demandé :\n\n
{schedule}\n\n
{additionalInfo}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['schedule', 'additionalInfo']
  },
  'report-request': {
    templateId: 'report-request',
    greeting: 'Bonjour {name},\n\n',
    body: `Concernant votre demande de rapport :\n\n
{reportStatus}\n\n
{additionalInfo}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['reportStatus', 'additionalInfo']
  },
  'protocol-discussion': {
    templateId: 'protocol-discussion',
    greeting: 'Bonjour {name},\n\n',
    body: `Concernant le protocole {protocol} :\n\n
{protocolDetails}\n\n
{enforcement}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'protocol'],
    optionalFields: ['protocolDetails', 'enforcement']
  },
  'notary-document': {
    templateId: 'notary-document',
    greeting: 'Bonjour {name},\n\n',
    body: `Concernant votre demande de document notarié :\n\n
{documentInfo}\n\n
{nextSteps}`,
    closing: '\n\nMerci.\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['documentInfo', 'nextSteps']
  },
  'financial-report': {
    templateId: 'financial-report',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici le rapport financier demandé :\n\n
{financialData}\n\n
{summary}`,
    closing: '\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['financialData', 'summary']
  },
  'upcoming-tasks': {
    templateId: 'upcoming-tasks',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici les tâches à venir :\n\n
{tasks}\n\n
{timeline}`,
    closing: '\n\nCordialement,\nGestion Velora',
    requiredFields: ['name'],
    optionalFields: ['tasks', 'timeline']
  },
  'mensual-report': {
    templateId: 'mensual-report',
    greeting: 'Bonjour {name},\n\n',
    body: `Voici le rapport mensuel pour {month} :\n\n
{reportContent}\n\n
{summary}`,
    closing: '\n\nCordialement,\nGestion Velora',
    requiredFields: ['name', 'month'],
    optionalFields: ['reportContent', 'summary']
  }
};

/**
 * Generate response based on classification and context
 */
export async function generateEmailResponse(
  originalEmail: {
    from: string;
    subject: string;
    body: string;
  },
  classification: EmailClassification,
  context: EmailContext,
  useLLM: boolean = true
): Promise<GeneratedResponse> {
  const template = RESPONSE_TEMPLATES[classification.template.id];
  
  if (!template) {
    // Fallback template
    return {
      subject: `Re: ${originalEmail.subject}`,
      body: `Bonjour,\n\nMerci pour votre courriel. Nous avons bien reçu votre demande et nous y répondrons dans les plus brefs délais.\n\nCordialement,\nGestion Velora`,
      suggestedActions: ['Review email', 'Prepare response'],
      priority: classification.template.priority,
      requiresHumanReview: true
    };
  }

  // Extract information from original email
  const extractedInfo = extractResponseInfo(originalEmail, classification, context);

  // Generate response using template
  let responseBody = template.greeting.replace('{name}', extractedInfo.name || '');
  
  // Fill in template fields
  let bodyText = template.body;
  for (const [key, value] of Object.entries(extractedInfo)) {
    bodyText = bodyText.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }

  // If LLM is enabled, enhance the response
  if (useLLM) {
    try {
      const enhancedBody = await enhanceResponseWithLLM(
        originalEmail.body,
        classification,
        bodyText,
        context
      );
      responseBody += enhancedBody;
    } catch (error) {
      console.error('LLM enhancement failed, using template:', error);
      responseBody += bodyText;
    }
  } else {
    responseBody += bodyText;
  }

  responseBody += template.closing;

  // Generate subject
  const subject = generateSubject(originalEmail.subject, classification);

  // Determine if human review is needed
  const requiresHumanReview = classification.template.priority >= 9 || 
                              context.urgency === 'critical' ||
                              classification.confidence < 0.7;

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(classification, context);

  return {
    subject,
    body: responseBody,
    suggestedActions,
    priority: classification.template.priority,
    requiresHumanReview
  };
}

/**
 * Extract information needed for response
 */
function extractResponseInfo(
  originalEmail: { from: string; subject: string; body: string },
  classification: EmailClassification,
  context: EmailContext
): Record<string, string> {
  const info: Record<string, string> = {};

  // Extract name from email
  const nameMatch = originalEmail.from.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  info.name = nameMatch ? nameMatch[1] : '';

  // Extract unit number
  const unitMatch = originalEmail.body.match(/(?:unit|condo|apartment|unité)\s*[#]?\s*(\d{4})/i) ||
                   originalEmail.body.match(/\b(\d{4})\b/);
  info.unit = unitMatch ? (Array.isArray(unitMatch) ? unitMatch[0].replace(/\D/g, '') : String(unitMatch).replace(/\D/g, '')) : '';

  // Extract amount
  const amountMatch = originalEmail.body.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  info.amount = amountMatch ? amountMatch[0] : '$250';

  // Extract move type
  if (classification.template.id === 'move-in-out-request') {
    info.moveType = originalEmail.body.toLowerCase().includes('move-in') ? 'emménagement' : 'déménagement';
  }

  // Extract topic from subject or body
  info.topic = originalEmail.subject || originalEmail.body.substring(0, 50);

  // Extract issue description
  if (classification.template.id === 'work-building') {
    const issueMatch = originalEmail.body.match(/(heating|hvac|leak|repair|maintenance|problem|issue)/i);
    info.issue = issueMatch ? issueMatch[0] : 'le problème signalé';
  }

  // Use extracted entities
  if (context.extractedEntities.phoneNumbers && context.extractedEntities.phoneNumbers.length > 0) {
    info.phoneNumber = context.extractedEntities.phoneNumbers[0];
  }

  return info;
}

/**
 * Enhance response with LLM for better context understanding
 */
async function enhanceResponseWithLLM(
  originalEmailBody: string,
  classification: EmailClassification,
  templateBody: string,
  context: EmailContext
): Promise<string> {
  const teacherStudent = new TeacherStudentSystem();
  
  const prompt = `You are a property management assistant. Generate a professional, helpful response in French or English (match the original email language).

Original Email:
"${originalEmailBody.substring(0, 500)}"

Classification: ${classification.template.name}
Confidence: ${classification.confidence}
Extracted Entities: ${JSON.stringify(context.extractedEntities)}

Template Response (use as base):
"${templateBody}"

Generate a complete, professional response that:
1. Addresses all questions/requests in the original email
2. Provides specific information based on extracted entities
3. Uses appropriate tone (professional, helpful)
4. Includes next steps or actions if needed
5. Matches the language of the original email

Response:`;

  try {
    const result = await teacherStudent.processQuery(prompt, 'general');
    const answer = result?.teacher_response?.answer || result?.student_response?.answer || templateBody;
    
    // Extract just the response part (remove any reasoning)
    const responseMatch = answer.match(/(?:Response:|Réponse:)?\s*(.+)/s);
    return responseMatch ? responseMatch[1].trim() : answer;
  } catch (error) {
    console.error('LLM enhancement failed:', error);
    return templateBody;
  }
}

/**
 * Generate appropriate subject line
 */
function generateSubject(originalSubject: string, classification: EmailClassification): string {
  // Remove "Re:" or "RE:" if present
  const cleanSubject = originalSubject.replace(/^(Re:|RE:|Fwd:|FWD:)\s*/i, '').trim();
  
  // Add appropriate prefix based on classification
  const prefixes: Record<string, string> = {
    'tenant-safety-complaint': 'Re: Sécurité - ',
    'legal-document-request': 'Re: Certificat Loi 16 - ',
    'work-building': 'Re: Travaux - ',
    'move-in-out-request': 'Re: Déménagement - ',
    'access-control-request': 'Re: Accès - ',
    'board-meeting-followup': 'Re: Suivi - '
  };

  const prefix = prefixes[classification.template.id] || 'Re: ';
  return prefix + cleanSubject;
}

/**
 * Generate suggested actions based on classification
 */
function generateSuggestedActions(
  classification: EmailClassification,
  context: EmailContext
): string[] {
  const actions: string[] = [];

  switch (classification.template.id) {
    case 'tenant-safety-complaint':
      actions.push('Review safety incident report', 'Contact security', 'Update TAL file', 'Send formal notice');
      break;
    case 'legal-document-request':
      actions.push('Prepare certificate', 'Calculate fees', 'Send invoice', 'Schedule delivery');
      break;
    case 'work-building':
      actions.push('Schedule technician visit', 'Order parts if needed', 'Update maintenance log');
      break;
    case 'move-in-out-request':
      actions.push('Schedule elevator reservation', 'Program fobs', 'Setup intercom', 'Send move-in package');
      break;
    case 'access-control-request':
      actions.push('Program intercom', 'Issue fobs if needed', 'Update access list');
      break;
    case 'board-meeting-followup':
      actions.push('Update status', 'Gather required information', 'Schedule follow-up');
      break;
    default:
      actions.push('Review email', 'Prepare response', 'Follow up if needed');
  }

  return actions;
}


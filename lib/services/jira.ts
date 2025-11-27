/**
 * Jira API Service
 * Creates issues in Jira for project tracking
 */

// Server-side only - these environment variables are accessed at runtime
const getJiraConfig = () => ({
  email: process.env.JIRA_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || '',
  domain: process.env.JIRA_DOMAIN || '',
  projectKey: process.env.JIRA_PROJECT_KEY || '',
});

// Custom Field IDs
const JIRA_FIELDS = {
  STORY_POINTS: 'customfield_10016',
  TIME: 'customfield_10037',
  GERENCIA: 'customfield_10073',
  IMPACTO_CATEGORIES: 'customfield_10074',
  IMPACTO_DESC: 'customfield_10075',
  IMPACTO_SCORE: 'customfield_10076',
  FRECUENCIA_DESC: 'customfield_10077',
  FRECUENCIA_SCORE: 'customfield_10078',
  REQUIERE_CAMBIOS: 'customfield_10079',
  DEPENDENCIAS_DETALLE: 'customfield_10080',
};

// Mappings
const GERENCIA_MAPPING: Record<string, string> = {
  'Intervención': '10061',
  'Gerencia General': '10059',
  'Gerencia de Prestaciones Médicas': '10060',
  'Gerencia de Administración y Finanzas': '10064',
  'Gerencia Servicios a Beneficiarios': '10065',
  'Gerencia de Asuntos Jurídicos': '10066',
  'Gerencia de Recursos Humanos': '10062',
  'Gerencia de Compras': '10063',
  'Gerencia Procesos y Sistemas': '10067',
  // Fallbacks for potential slight naming variations or raw codes
  'intervention': '10061',
  'general_management': '10059',
  'medical_services': '10060',
  'administration_finance': '10064',
  'beneficiary_services': '10065',
  'legal_affairs': '10066',
  'human_resources': '10062',
  'purchasing': '10063',
  'processes_systems': '10067',
};

const IMPACTO_CATEGORY_MAPPING: Record<string, string> = {
  'efficiency': '10068', // Eficiencia
  'member_experience': '10069', // Experiencia afiliado
  'control': '10070', // Control
  'compliance': '10071', // Cumplimiento normativo
  'others': '10072', // Otros
};

const SCORE_MAPPING: Record<number, string> = {
  1: '10073', // For Impacto (check if Frequency uses same IDs or different)
  2: '10074',
  3: '10075',
  4: '10076',
  5: '10077',
};

// Frequency scores seem to have different IDs in the JSON
const FREQUENCY_SCORE_MAPPING: Record<number, string> = {
  1: '10078',
  2: '10079',
  3: '10080',
  4: '10081',
  5: '10082',
};

const BOOLEAN_MAPPING = {
  YES: '10083', // Si
  NO: '10084',  // No
};

type UrgencyLevel = 'high' | 'medium' | 'low';

type JiraIssuePayload = {
  fields: {
    project: { key: string };
    summary: string;
    description: any;
    issuetype: { name: string };
    priority?: { name: string };
    [key: string]: any;
  };
};

type CreateJiraTicketInput = {
  title: string;
  description: string;
  urgency: UrgencyLevel;
  storyPoints?: number;
  timeSize?: 'XL' | 'L' | 'M' | 'S' | 'XS';
  // New fields
  requestingDepartment: string;
  impactDescription?: string | null;
  impactScore: number;
  impactCategories?: string[] | null;
  frequencyDescription?: string | null;
  frequencyScore: number;
  hasExternalDependencies: boolean;
  dependenciesDetail?: string | null;
  contactName: string;
  contactEmail?: string;
};

type CreateJiraTicketResult =
  | { success: true; issueKey: string; issueUrl: string }
  | { success: false; error: string };

const mapUrgencyToPriority = (urgency: UrgencyLevel): string => {
  const map: Record<UrgencyLevel, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[urgency];
};

const buildDescription = (input: CreateJiraTicketInput) => {
  const content = [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: input.description }]
    },
    { type: 'rule' },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Contacto: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: `${input.contactName}` + (input.contactEmail ? ` (${input.contactEmail})` : '') }
      ]
    }
  ];

  return {
    type: 'doc',
    version: 1,
    content,
  };
};

export async function createJiraTicket(input: CreateJiraTicketInput): Promise<CreateJiraTicketResult> {
  const { email, apiToken, domain, projectKey } = getJiraConfig();

  if (!email || !apiToken || !domain || !projectKey) {
    console.error('[Jira] Missing Jira configuration');
    return { success: false, error: 'Jira integration not configured' };
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const payload: JiraIssuePayload = {
      fields: {
        project: { key: projectKey },
        summary: input.title,
        description: buildDescription(input),
        issuetype: { name: process.env.JIRA_ISSUE_TYPE || 'Task' },
        priority: { name: mapUrgencyToPriority(input.urgency) },
      },
    };

    // Map Custom Fields

    // Gerencia
    const gerenciaId = GERENCIA_MAPPING[input.requestingDepartment];
    if (gerenciaId) {
      payload.fields[JIRA_FIELDS.GERENCIA] = { id: gerenciaId };
    }

    // Impacto Categories
    if (input.impactCategories && input.impactCategories.length > 0) {
      const impactIds = input.impactCategories
        .map(cat => IMPACTO_CATEGORY_MAPPING[cat])
        .filter(Boolean)
        .map(id => ({ id }));

      if (impactIds.length > 0) {
        payload.fields[JIRA_FIELDS.IMPACTO_CATEGORIES] = impactIds;
      }
    }

    // Impacto Desc
    if (input.impactDescription) {
      payload.fields[JIRA_FIELDS.IMPACTO_DESC] = input.impactDescription;
    }

    // Impacto Score
    if (SCORE_MAPPING[input.impactScore]) {
      payload.fields[JIRA_FIELDS.IMPACTO_SCORE] = { id: SCORE_MAPPING[input.impactScore] };
    }

    // Frecuencia Desc
    if (input.frequencyDescription) {
      payload.fields[JIRA_FIELDS.FRECUENCIA_DESC] = input.frequencyDescription;
    }

    // Frecuencia Score
    if (FREQUENCY_SCORE_MAPPING[input.frequencyScore]) {
      payload.fields[JIRA_FIELDS.FRECUENCIA_SCORE] = { id: FREQUENCY_SCORE_MAPPING[input.frequencyScore] };
    }

    // Requiere Cambios (Dependencias)
    payload.fields[JIRA_FIELDS.REQUIERE_CAMBIOS] = {
      id: input.hasExternalDependencies ? BOOLEAN_MAPPING.YES : BOOLEAN_MAPPING.NO
    };

    // Dependencias Detalle
    if (input.dependenciesDetail) {
      payload.fields[JIRA_FIELDS.DEPENDENCIAS_DETALLE] = input.dependenciesDetail;
    }

    // Story Points
    if (input.storyPoints !== undefined) {
      payload.fields[JIRA_FIELDS.STORY_POINTS] = input.storyPoints;
    }

    // Time
    if (input.timeSize) {
      payload.fields[JIRA_FIELDS.TIME] = { value: input.timeSize };
    }

    console.log(`[Jira] Creating issue in project ${projectKey}...`);

    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jira] Failed to create issue. Status:', response.status);
      console.error('[Jira] Response body:', errorText);
      return { success: false, error: `Failed to create Jira issue: ${response.status}. Details: ${errorText}` };
    }

    const result = await response.json();
    const issueKey = result.key;
    const issueUrl = `https://${domain}/browse/${issueKey}`;

    console.log(`[Jira] Created issue ${issueKey}: ${issueUrl}`);

    // Transition to Backlog
    try {
      const transitionsResponse = await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'GET',
        headers,
      });

      if (transitionsResponse.ok) {
        const transitionsData = await transitionsResponse.json();
        const transitions = transitionsData.transitions || [];
        const backlogTransition = transitions.find((t: any) =>
          t.name.toLowerCase() === 'backlog' || t.to?.name.toLowerCase() === 'backlog'
        );

        if (backlogTransition) {
          console.log(`[Jira] Found 'Backlog' transition (ID: ${backlogTransition.id}). Executing...`);
          await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/transitions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ transition: { id: backlogTransition.id } }),
          });
        }
      }
    } catch (e) {
      console.error('[Jira] Transition error:', e);
    }

    return { success: true, issueKey, issueUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Jira] Error creating ticket:', message);
    return { success: false, error: message };
  }
}

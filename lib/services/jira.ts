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

const JIRA_FIELD_STORY_POINTS = 'customfield_10016';
const JIRA_FIELD_TIME = 'customfield_10037';

type UrgencyLevel = 'high' | 'medium' | 'low';

type JiraIssuePayload = {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description: {
      type: string;
      version: number;
      content: Array<{
        type: string;
        content?: Array<{
          type: string;
          text?: string;
        }>;
      }>;
    };
    issuetype: {
      name: string;
    };
    priority?: {
      name: string;
    };
    [key: string]: unknown;
  };
};

type CreateJiraTicketInput = {
  title: string;
  description: string;
  urgency: UrgencyLevel;
  storyPoints?: number;
  timeSize?: 'XL' | 'L' | 'M' | 'S' | 'XS';
};

type CreateJiraTicketResult =
  | {
    success: true;
    issueKey: string;
    issueUrl: string;
  }
  | {
    success: false;
    error: string;
  };

const mapUrgencyToPriority = (urgency: UrgencyLevel): string => {
  const map: Record<UrgencyLevel, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[urgency];
};

const buildDescription = (text: string) => ({
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text,
        },
      ],
    },
  ],
});

export async function createJiraTicket(input: CreateJiraTicketInput): Promise<CreateJiraTicketResult> {
  const { email, apiToken, domain, projectKey } = getJiraConfig();

  if (!email || !apiToken || !domain || !projectKey) {
    console.error('[Jira] Missing Jira configuration in environment variables');
    return {
      success: false,
      error: 'Jira integration not configured',
    };
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    const payload: JiraIssuePayload = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: input.title,
        description: buildDescription(input.description),
        issuetype: {
          name: 'Task',
        },
        priority: {
          name: mapUrgencyToPriority(input.urgency),
        },
      },
    };

    // Add Story Points if provided
    if (input.storyPoints !== undefined) {
      payload.fields[JIRA_FIELD_STORY_POINTS] = input.storyPoints;
    }

    // Add Time (T-shirt size) if provided
    if (input.timeSize) {
      payload.fields[JIRA_FIELD_TIME] = {
        value: input.timeSize,
      };
    }

    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Jira] Failed to create issue:', response.status, errorText);
      return {
        success: false,
        error: `Failed to create Jira issue: ${response.status}`,
      };
    }

    const result = await response.json();
    const issueKey = result.key;
    const issueUrl = `https://${domain}/browse/${issueKey}`;

    console.log(`[Jira] Created issue ${issueKey}: ${issueUrl}`);

    return {
      success: true,
      issueKey,
      issueUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Jira] Error creating ticket:', message);
    return {
      success: false,
      error: message,
    };
  }
}

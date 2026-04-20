import { createHash } from 'node:crypto'
import {
  FUNGIES_MCP_SKILL_DESCRIPTION,
  FUNGIES_MCP_SKILL_MD,
  FUNGIES_MCP_SKILL_NAME,
} from './fungiesMcpSkill.js'

const SCHEMA_URI = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'

function sha256Hex(input: string): string {
  return createHash('sha256').update(Buffer.from(input, 'utf8')).digest('hex')
}

const FUNGIES_MCP_SKILL_DIGEST = `sha256:${sha256Hex(FUNGIES_MCP_SKILL_MD)}`

export function buildAgentSkillsIndex() {
  return {
    $schema: SCHEMA_URI,
    skills: [
      {
        name: FUNGIES_MCP_SKILL_NAME,
        type: 'skill-md' as const,
        description: FUNGIES_MCP_SKILL_DESCRIPTION,
        url: `/.well-known/agent-skills/${FUNGIES_MCP_SKILL_NAME}/SKILL.md`,
        digest: FUNGIES_MCP_SKILL_DIGEST,
      },
    ],
  }
}

export { FUNGIES_MCP_SKILL_DIGEST, FUNGIES_MCP_SKILL_MD, FUNGIES_MCP_SKILL_NAME }

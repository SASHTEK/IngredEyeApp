const BASE_URL = 'https://food-mcp-server.rootsbybenda.workers.dev/mcp';

function mapScoreToSeverity(score) {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function formatPregnancy(val) {
  if (!val) return 'N/A';
  if (val === 'yes') return 'Safe';
  if (val === 'no') return 'Avoid';
  if (val === 'caution') return 'Caution';
  return val;
}

function formatChildren(val) {
  if (!val) return 'N/A';
  if (val === 'yes') return 'Safe';
  if (val === 'no') return 'Avoid';
  if (val === 'caution') return 'Caution';
  return val;
}

let nextId = 1;
function genId() { return nextId++; }

class RootsBendaClient {
  constructor() {
    this.sessionId = null;
  }

  async sendMessage(body) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const sessHead = response.headers.get('Mcp-Session-Id');
    if (sessHead && !this.sessionId) this.sessionId = sessHead;

    const text = await response.text();
    const ct = response.headers.get('Content-Type') || '';

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    if (ct.includes('text/event-stream') || text.startsWith('event:') || text.startsWith('data:')) {
      const parsed = this.parseSSEResponse(text);
      if (parsed) return parsed;
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Bad response: ${text.slice(0, 100)}`);
    }
  }

  parseSSEResponse(text) {
    for (const part of text.split('\n\n')) {
      let eventType = '';
      let data = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) eventType = line.slice(7);
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      if (data) {
        try { return JSON.parse(data); } catch {}
      }
    }
    return null;
  }

  async initialize() {
    return this.sendMessage({
      jsonrpc: '2.0',
      id: genId(),
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'ingredeye', version: '1.0' },
      },
    });
  }

  async sendToolCall(name, args) {
    return this.sendMessage({
      jsonrpc: '2.0',
      id: genId(),
      method: 'tools/call',
      params: { name, arguments: args },
    });
  }

  parseContent(response) {
    if (response?.error) {
      console.error('MCP error:', response.error);
      return null;
    }
    if (!response?.result?.content) return null;

    for (const item of response.result.content) {
      if (item.type === 'text' && item.text) {
        try {
          return JSON.parse(item.text);
        } catch {
          return item.text;
        }
      }
    }
    return null;
  }

  mergeResults(listItem, additiveData) {
    const base = {
      eNumber: listItem.e_number || null,
      name: listItem.matched || listItem.input,
      severity: mapScoreToSeverity(listItem.safety_score || 0),
      risk: listItem.health_concerns || 'No risk information available.',
      category: listItem.category || null,
      safetyScore: listItem.safety_score || null,
      safetyScale: '1 (safest) to 10 (most concerning)',
      iarcGroup: null,
      pregnancySafe: null,
      childrenSafe: null,
      commonFoods: null,
      source: 'JECFA, EFSA, FDA via Roots by Benda',
    };

    if (additiveData) {
      base.category = additiveData.category || base.category;
      base.safetyScore = additiveData.safety_score ?? base.safetyScore;
      base.iarcGroup = additiveData.health?.iarc_group?.value || null;
      base.pregnancySafe = formatPregnancy(additiveData.health?.pregnancy_safe);
      base.childrenSafe = formatChildren(additiveData.health?.children_safe);
      base.commonFoods = additiveData.common_foods || null;
    }

    return base;
  }

  mapBasicResult(listItem) {
    return {
      eNumber: listItem.e_number || null,
      name: listItem.matched || listItem.input,
      severity: mapScoreToSeverity(listItem.safety_score || 0),
      risk: listItem.health_concerns || 'No risk information available.',
      category: listItem.category || null,
      safetyScore: listItem.safety_score || null,
      safetyScale: '1 (safest) to 10 (most concerning)',
      iarcGroup: null,
      pregnancySafe: null,
      childrenSafe: null,
      commonFoods: null,
      source: 'JECFA, EFSA, FDA via Roots by Benda',
    };
  }

  async checkIngredients(ingredientsText) {
    if (!ingredientsText || !String(ingredientsText).trim()) return [];

    const cleaned = String(ingredientsText).replace(/[\s-]+/g, ' ');
    const parts = cleaned
      .split(/[,;:.()]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2)
      .map(s => s.replace(/^INS/i, 'E'));

    if (parts.length === 0) return [];

    const ingredientStr = parts.join(', ');

    try {
      this.sessionId = null;
      await this.initialize();

      const listResponse = await this.sendToolCall('check_ingredient_list', {
        ingredients: ingredientStr,
      });

      const listData = this.parseContent(listResponse);
      if (!listData || !listData.all_results) return [];

      const matched = listData.all_results.filter(r => r.matched);
      if (matched.length === 0) return [];

      const seen = new Map();
      const deduped = matched.filter(r => {
        const key = r.e_number || r.matched;
        if (seen.has(key)) return false;
        seen.set(key, true);
        return true;
      });

      const enriched = [];
      for (const item of deduped) {
        try {
          const query = item.e_number || item.matched;
          const addResponse = await this.sendToolCall('check_additive', { query });
          const addData = this.parseContent(addResponse);
          enriched.push(this.mergeResults(item, addData));
        } catch {
          enriched.push(this.mapBasicResult(item));
        }
      }

      return enriched;
    } catch (err) {
      console.error('checkIngredients failed:', err);
      return [];
    }
  }
}

const rootsClient = new RootsBendaClient();
export default rootsClient;

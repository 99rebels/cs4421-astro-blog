export interface GeminiReply {
	text: string;
	inputTokens: number;
	outputTokens: number;
}

interface GenerateContentResponse {
	candidates?: { content?: { parts?: { text?: string }[] } }[];
	usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

/**
 * One call to Gemini's generateContent endpoint, asking for a JSON reply. Plain fetch is
 * enough for a single request, so there's no SDK dependency.
 */
export async function askGemini(apiKey: string, model: string, system: string, prompt: string): Promise<GeminiReply> {
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
		method: 'POST',
		// In a header rather than the URL, so the key can't end up in a logged address.
		headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: system }] },
			contents: [{ role: 'user', parts: [{ text: prompt }] }],
			generationConfig: { responseMimeType: 'application/json' },
		}),
		signal: AbortSignal.timeout(120_000),
	});

	if (!response.ok) {
		// Google's error body explains the problem (bad key, retired model, quota) and never
		// contains the key itself.
		throw new Error(`Gemini returned HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
	}

	const data = (await response.json()) as GenerateContentResponse;
	const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
	const usage = data.usageMetadata ?? {};

	return {
		text,
		inputTokens: usage.promptTokenCount ?? 0,
		// Thinking tokens are billed as output, so they're counted here too.
		outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
	};
}

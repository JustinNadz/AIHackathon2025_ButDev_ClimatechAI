export async function POST(request: Request) {
	try {
		const { messages } = await request.json();
		const last: string = messages?.[messages.length - 1]?.content?.toString?.() || "";

		// Try to parse coordinates from the last message (e.g., "14.6, 120.98")
		const coordMatch = last.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
		const lat = coordMatch ? parseFloat(coordMatch[1]) : 14.5995; // Manila default
		const lng = coordMatch ? parseFloat(coordMatch[2]) : 120.9842;

		const backend = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

		const res = await fetch(`${backend}/api/assistant/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				lat,
				lng,
				question: last || 'What should I do right now to stay safe?'
			})
		});

		if (!res.ok) {
			const text = await res.text();
			return new Response(text || 'Backend assistant error', { status: 502 });
		}

		const data = await res.json();
		const reply = data?.advice || 'No advice available right now.';
		return Response.json({ reply });
	} catch (err: any) {
		return new Response('Invalid request', { status: 400 });
	}
}



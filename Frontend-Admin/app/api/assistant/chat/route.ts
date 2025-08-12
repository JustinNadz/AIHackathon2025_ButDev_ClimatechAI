export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
	try {
		const { messages } = await request.json();
		const last: string = messages?.[messages.length - 1]?.content?.toString?.() || "";

		// Try to parse coordinates from the last message (e.g., "14.6, 120.98")
		const coordMatch = last.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
		const lat = coordMatch ? parseFloat(coordMatch[1]) : 14.5995; // Manila default
		const lng = coordMatch ? parseFloat(coordMatch[2]) : 120.9842;

		const backend =
			process.env.BACKEND_BASE_URL ||
			process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
			process.env.NEXT_PUBLIC_BACKEND_URL ||
			'http://localhost:8000';

		const res = await fetch(`${backend}/api/assistant/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				lat,
				lng,
				question: last || 'What should I do right now to stay safe?'
			})
		});

		if (res.ok) {
			const data = await res.json();
			const reply = data?.advice || data?.reply || 'No advice available right now.';
			return Response.json({ reply });
		}

		// Fallback locally if backend is unavailable
		const fallback = `Here are immediate safety steps for your location (${lat.toFixed(3)}, ${lng.toFixed(3)}):\n\n` +
			`1) Move to higher ground if flooding is possible.\n` +
			`2) Keep your phone charged and a flashlight ready.\n` +
			`3) Follow local authority announcements.\n` +
			`4) Share your location with family if you evacuate.`;
		return Response.json({ reply: fallback, offline: true }, { status: 200 });
	} catch (err: any) {
		return new Response('Invalid request', { status: 400 });
	}
}



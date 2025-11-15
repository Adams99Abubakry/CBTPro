import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error("Message is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful AI assistant for an Advanced Computer-Based Testing (CBT) Platform. 

Your role is to assist visitors and users with information about the platform. Here's what you should know:

PLATFORM FEATURES:
- Rich Question Types: Multiple choice, true/false, and essay questions
- Timed Exams: Configurable time limits with countdown timers
- Anti-Cheating: Full-screen enforcement and tab-switch detection
- Instant Results: Automatic grading and immediate feedback
- Secure Exam Delivery: Browser lockdown and randomized questions
- Real-time Monitoring: Live exam monitoring and analytics
- Advanced Analytics: Detailed performance insights and reports

USER TYPES:
1. Students: Can take exams, view results, and access academic records
2. Lecturers: Can create exams, upload course materials, and view submissions
3. Administrators: Can manage users, system settings, and complaints

KEY CAPABILITIES:
- Create and schedule exams with multiple question types
- Upload and manage course materials (PDFs, documents, videos)
- Track student performance and academic records
- Submit and manage complaints
- Export exam results and analytics

Be friendly, professional, and concise. If asked about pricing or features not mentioned, say you can help them get in touch with the team. Always encourage users to try the free trial.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { complaintTitle, complaintDescription } = await req.json();
    
    if (!complaintTitle || !complaintDescription) {
      throw new Error("Complaint title and description are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // FAQ knowledge base
    const faqContext = `
You are an AI assistant for an online examination system. Here are common FAQs:

1. Forgot Password: Users can reset their password using the "Forgot Password" link on the login page.
2. Exam Access: Exams are only accessible during their scheduled time window.
3. Technical Issues: If you experience technical issues, clear your browser cache and try again. If the problem persists, contact technical support.
4. Submission Problems: Make sure to click "Submit Exam" before the timer expires. Late submissions are not accepted.
5. Account Activation: Lecturer accounts require admin approval before activation.
6. Exam Results: Results are typically available within 24-48 hours after exam completion.
7. Browser Requirements: Use Chrome, Firefox, or Edge for the best experience.
8. Network Issues: Ensure stable internet connection during exams. Mobile hotspots may be unreliable.

If the complaint is simple and matches a FAQ, provide a helpful response. 
If the complaint requires admin attention (complex issues, appeals, unfair treatment, system bugs, payment issues), 
respond with: "ADMIN_REQUIRED: [brief explanation of why admin attention is needed]"

Be professional, empathetic, and concise.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: faqContext },
          { 
            role: "user", 
            content: `Complaint Title: ${complaintTitle}\n\nComplaint Description: ${complaintDescription}\n\nProvide a helpful response or indicate if admin attention is required.` 
          }
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
    
    // Check if admin is required
    const requiresAdmin = aiResponse.startsWith("ADMIN_REQUIRED:");
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        requiresAdmin: requiresAdmin
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in complaint-ai-response:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

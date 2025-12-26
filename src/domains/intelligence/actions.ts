'use server';

/**
 * GeneratedIntelligence Domain - Gemini Server Actions
 * 
 * Secure, server-side execution of Gemini AI operations.
 * This replaces the client-side service to prevent API key exposure.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { getAuthenticatedUser } from '@/src/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { JobInfo } from '@/src/domains/jobs/types';
import type {
  AnalysisResult,
  ResearchResult,
  ToneType,
  LinkedInMessageInput,
  InterviewQuestion
} from '@/src/domains/intelligence/types';
import { extractWebSources } from '@/src/types/gemini';
import { checkRateLimit } from '@/src/utils/rateLimit';
import { aiCache, generateCacheKey } from '@/src/utils/aiCache';
import { isValidUrl, sanitizeText } from '@/src/utils/validation';

// Server-side API key only (no client-side fallback)
const apiKey = process.env.GEMINI_API_KEY;

// Development-only logging
if (process.env.NODE_ENV === 'development' && apiKey) {
  console.log('[Gemini Init] API key configured successfully');
}

// Fail fast if key is missing
if (!apiKey) {
  throw new Error(
    'CRITICAL: GEMINI_API_KEY is not configured in environment variables. ' +
    'The application cannot function without a valid API key. ' +
    'Please add GEMINI_API_KEY=your_key to your .env.local file (development) ' +
    'or configure it in Vercel Environment Variables (production).'
  );
}

const ai = new GoogleGenAI({ apiKey });

// Helper: Check and Increment Feature Usage Limit (3x per job)
const checkFeatureLimit = async (
  supabase: SupabaseClient,
  userId: string,
  jobId: string | undefined,
  outputType: 'resume_scan' | 'company_research' | 'cover_letter' | 'linkedin_message' | 'interview_prep'
) => {
  // 1. Admin Bypass
  const { data: userRole } = await supabase.from('users').select('role').eq('id', userId).single();
  if (userRole?.role === 'admin') return;

  if (!jobId) return;

  // 2. Check Limit
  const { data: output } = await supabase
    .from('job_outputs')
    .select('generation_count')
    .match({ job_id: jobId, type: outputType })
    .single();

  if (output && (output.generation_count || 0) >= 3) {
    throw new Error(`Usage limit reached: You can only regenerate this feature 3 times per job application.`);
  }

  // 3. Increment (Optimistic)
  await supabase.rpc('increment_job_output_generation', { p_job_id: jobId, p_type: outputType });
};

// ... (imports)

// 1. Extract Text from Resume (PDF)
export const extractResumeText = async (fileBase64: string, mimeType: string = 'application/pdf'): Promise<string> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Rate Limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'resumeExtraction');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: fileBase64 // Assuming Base64 is safe/validated by file upload limit elsewhere, but good to check size? 
                // Next.js body limits protect us, but the prompt is text.
              }
            },
            {
              text: "Extract all the text content from this resume document. Organize it clearly by sections (Experience, Education, Skills, etc.). Do not summarize, just extract."
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'text/plain'
      }
    });

    // Sanitize output just in case, though AI text is usually safe content-wise, length matters.
    return sanitizeText(response.text || "", 100000); // 100k chars for resume text seems generous but safe.
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Rate limit')) throw err;
    console.error("Error parsing resume:", err);
    throw new Error(`Failed to extract text from resume: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// 2. Company Research
export const researchCompany = async (companyName: string, companyUrl?: string): Promise<ResearchResult> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Validate Inputs
    const cleanCompanyName = sanitizeText(companyName, 200);
    const cleanCompanyUrl = isValidUrl(companyUrl) ? companyUrl : undefined;

    if (!cleanCompanyName) throw new Error("Company name is required");

    // Rate limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'companyResearch');
    }

    // Check cache first
    const cacheKey = generateCacheKey('companyResearch', { companyName: cleanCompanyName, companyUrl: cleanCompanyUrl || '' });
    const cached = aiCache.companyResearch.get(cacheKey);
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Cache Hit] Company research for:', cleanCompanyName);
      }
      return cached as ResearchResult;
    }

    const prompt = `Research the company "${cleanCompanyName}"${cleanCompanyUrl ? ` (${cleanCompanyUrl})` : ''}.
    Focus on:
    1. Mission and values.
    2. Recent news (last 6 months).
    3. Company culture.
    4. Key products/services.
    
    Provide a comprehensive summary useful for a job applicant.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - Use Markdown formatting.
    - Use ## for Section Headers (e.g., ## Mission & Values).
    - Use bullet points for lists.
    - Use **bold** for key terms or emphasized points.
    - Keep it structured and easy to scan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    // Extract grounding metadata for sources (type-safe)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = extractWebSources(Array.isArray(groundingChunks) ? groundingChunks : []);

    // Remove duplicates
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    const result = {
      summary: response.text || "No research data available.",
      sources: uniqueSources
    };

    // Cache for 24 hours
    aiCache.companyResearch.set(cacheKey, result);

    return result;
  } catch (err: unknown) {
    console.error("Error researching company:", err);
    // Re-throw rate limit errors so user sees them
    if (err instanceof Error && err.message.includes('Rate limit')) {
      throw err;
    }
    return { summary: "Could not complete company research due to an error.", sources: [] };
  }
};

// 3. Analyze Resume against Job Description
export const analyzeResume = async (
  resumeText: string,
  jobInfo: JobInfo,
  userLinks?: { portfolio?: string, linkedin?: string }
): Promise<AnalysisResult> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Rate Limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'resumeAnalysis');
    }

    // Feature Usage Limit (3x per job)
    await checkFeatureLimit(supabase, user.id, jobInfo.id, 'resume_scan');

    // Sanitize Inputs
    const cleanResume = sanitizeText(resumeText, 50000);
    const cleanJobDescription = sanitizeText(jobInfo.description, 50000);
    const cleanTitle = sanitizeText(jobInfo.title, 500);
    const cleanCompany = sanitizeText(jobInfo.company, 200);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this resume against the job description.
        
        JOB DESCRIPTION:
        Title: ${cleanTitle}
        Company: ${cleanCompany}
        Description: ${cleanJobDescription}
        
        RESUME:
        ${cleanResume}

        CANDIDATE LINKS:
        Portfolio: ${isValidUrl(userLinks?.portfolio) ? userLinks?.portfolio : "N/A"}
        LinkedIn: ${isValidUrl(userLinks?.linkedin) ? userLinks?.linkedin : "N/A"}
        
        INSTRUCTION: If valid Portfolio or LinkedIn URLs are provided above, use Google Search to visit and SCAN them to gather more context about the candidate's actual work history, skills, and projects. Use this external context to refine your recommendations.

        Return a JSON object with:
        - score (number 0-100)
        - missingKeywords (array of strings)
        - recommendations (array of strings, specific actionable advice. If the candidate has a portfolio/linkedin link, check if it's relevant to include or highlight)
        - atsCompatibility (string, brief assessment)
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            atsCompatibility: { type: Type.STRING },
          },
          required: ["score", "missingKeywords", "recommendations", "atsCompatibility"],
        },
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty analysis response");

    return JSON.parse(jsonText) as AnalysisResult;
  } catch (err: unknown) {
    console.error("Error analyzing resume:", err);
    return {
      score: 0,
      missingKeywords: [],
      recommendations: ["Failed to analyze resume."],
      atsCompatibility: "Unknown"
    };
  }
};

// 4. Generate Cover Letter
export const generateCoverLetter = async (
  resumeText: string,
  jobInfo: JobInfo,
  research: ResearchResult,
  tone: ToneType,
  userLinks?: { portfolio?: string, linkedin?: string }
): Promise<string> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Rate Limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'coverLetter');
    }

    // Feature Usage Limit (3x per job)
    await checkFeatureLimit(supabase, user.id, jobInfo.id, 'cover_letter');

    // Sanitize
    const cleanResume = sanitizeText(resumeText, 50000);
    const cleanDesc = sanitizeText(jobInfo.description, 50000);
    const cleanResearch = sanitizeText(research.summary, 20000);
    const cleanTitle = sanitizeText(jobInfo.title, 500);
    const cleanCompany = sanitizeText(jobInfo.company, 200);
    const portfolioUrl = isValidUrl(userLinks?.portfolio) ? userLinks?.portfolio : "N/A";
    const linkedinUrl = isValidUrl(userLinks?.linkedin) ? userLinks?.linkedin : "N/A";

    const prompt = `
      You are an expert career coach and professional writer specializing in creating compelling cover letters that get candidates interviews. Your task is to craft a cover letter that makes hiring managers think "I need to meet this person."

      JOB INFORMATION:
      Title: ${cleanTitle}
      Company: ${cleanCompany}
      Job Description: ${cleanDesc}

      COMPANY RESEARCH & INSIGHTS:
      ${cleanResearch}

      CANDIDATE PROFILE (Extracted from Resume):
      ${cleanResume}

      CANDIDATE EXTERNAL LINKS:
      Portfolio: ${portfolioUrl}
      LinkedIn: ${linkedinUrl}

      INSTRUCTION: Use Google Search to READ the candidate's Portfolio and LinkedIn (if valid URLs provided) to find specific, real-world examples of their work, projects, or posts to mention in the letter to increase credibility.

      STRATEGIC REQUIREMENTS:
      1. OPENING HOOK (Critical - 2-3 sentences):
         - Start with a specific, authentic connection to the company
         - Reference recent news, product launch, mission, or company challenge
         - Make it impossible to be used for any other company
         - Immediately state the position and create intrigue

      2. VALUE PROPOSITION (Body paragraph 1):
         - Lead with the most impressive, relevant achievement
         - Use specific metrics and outcomes (e.g., "increased revenue by 40%", "led team of 12")
         - Directly connect this achievement to a key job requirement
         - Show you understand their challenge and have solved it before

      3. PROOF OF FIT (Body paragraph 2):
         - Highlight 2-3 additional relevant experiences
         - Match your skills to their specific tech stack/requirements
         - Demonstrate cultural alignment with company values
         - If a portfolio URL is provided (${portfolioUrl}), mention it if relevant (e.g., "You can see examples of my work in my portfolio...").

      4. FORWARD-LOOKING CLOSE:
         - Express specific excitement about company's future/mission
         - Briefly mention what you'd bring to their upcoming projects/challenges
         - Include confident call to action
         - Professional but warm sign-off

      TONE CALIBRATION: ${tone}
      - If "Professional": Polished, accomplished, authoritative but approachable
      - If "Conversational": Confident, personable, energetic, authentic
      - If "Creative": Distinctive voice, memorable, slightly unconventional but professional
      - If "Bold": High confidence, direct, persuasive

      CRITICAL QUALITY STANDARDS:
      ✓ Every sentence must add unique value - no filler
      ✓ Use active voice and strong action verbs (led, built, launched, achieved)
      ✓ Include at least 3 specific metrics/numbers from resume
      ✓ Company name appears 2-3 times naturally
      ✓ Zero generic statements that could apply to any company
      ✓ Show personality while maintaining professionalism
      ✓ Demonstrate research without sounding like you googled them
      ✓ Balance confidence with humility
      ✓ Make it sound human, not AI-generated

      AVOID AT ALL COSTS:
      ✗ "I am writing to apply for..." (weak opening)
      ✗ "I am passionate about..." without proof
      ✗ Generic praise ("your innovative company")
      ✗ Repeating the job description back
      ✗ Clichés ("think outside the box", "hit the ground running")
      ✗ Self-deprecation or hesitant language ("I think", "I hope")
      ✗ Overly long paragraphs (max 4-5 sentences each)

      LENGTH: 300-400 words (recruiters spend 30 seconds scanning)

      OUTPUT FORMAT:
      Return only the cover letter text, professionally formatted with proper spacing between paragraphs. 
      Include a standard salutation (e.g., "Dear Hiring Team,") and a placeholder for signature (e.g., "Sincerely,\n[Your Name]").
      Do not include date or address blocks at the top.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    return response.text || "Failed to generate cover letter.";
  } catch (err: unknown) {
    console.error("Error generating cover letter:", err);
    throw new Error("Failed to generate cover letter.");
  }
};

// 5. Generate LinkedIn First Message
export const generateLinkedInMessage = async (
  resumeText: string,
  jobInfo: JobInfo,
  input: LinkedInMessageInput,
  researchSummary: string
): Promise<string> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Rate Limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'linkedInMessage');
    }

    // Feature Usage Limit (3x per job)
    await checkFeatureLimit(supabase, user.id, jobInfo.id, 'linkedin_message');

    // Sanitize
    const cleanResume = sanitizeText(resumeText, 50000);
    const cleanResearch = sanitizeText(researchSummary, 20000);
    const recruiterName = sanitizeText(input.recruiterName || "[Name]", 100);
    const recruiterTitle = sanitizeText(input.recruiterTitle || "Recruiter/Manager", 100);
    const recentActivity = sanitizeText(input.recentActivity || "N/A", 1000);
    const messageIntent = sanitizeText(input.messageIntent, 500);
    const connectionContext = sanitizeText(input.connectionContext, 500);
    const mutualConnection = sanitizeText(input.mutualConnection || "N/A", 100);
    const customAddition = sanitizeText(input.customAddition || "N/A", 1000);
    const missingContext = sanitizeText(input.missingContext || "", 1000);

    const prompt = `
      You are a LinkedIn messaging strategist specializing in connecting with ${input.connectionStatus === 'new' ? 'new connections' : 'existing connections'}. 
      Your messages get 40%+ response rates by striking the perfect balance between professional and personable, interested but not desperate, informative but concise.

      CONTEXT: 
      ${input.connectionStatus === 'new'
        ? 'The recruiter/person just accepted the user\'s connection request within the past 24-48 hours. This is the critical first real interaction.'
        : 'The user is reaching out to an existing connection to reconnect, follow up, or start a new conversation about an opportunity.'}

      ---

      RECIPIENT INFORMATION:
      Name: ${recruiterName}
      Title: ${recruiterTitle}
      Company: ${jobInfo.company}
      Recent Activity: ${recentActivity}

      CANDIDATE INFORMATION (From Resume):
      ${cleanResume}

      JOB/INTENT CONTEXT:
      Target Role: ${jobInfo.title}
      Message Intent: ${messageIntent}
      Connection Context: ${connectionContext}
      Mutual Connection: ${mutualConnection}

      CUSTOM ADDITIONS:
      ${customAddition}
      ${missingContext ? `\n      ADDITIONAL CONTEXT FROM USER:\n      ${missingContext}` : ''}

      COMPANY RESEARCH:
      ${cleanResearch}

      ---

      YOUR MISSION:
      Create a message that makes the recipient think: "This person is professional, prepared, and worth talking to. I should respond."

      THE 4-PART STRUCTURE (150-200 words total):
      
      PART 1 - WARM OPENING (30-40 words):
      - ${input.connectionStatus === 'new' ? 'Thank them for connecting.' : 'Reconnect politely ("Hope you are doing well").'}
      - Reference why you reached out.
      - Weave in connection context.

      PART 2 - CREDIBILITY STATEMENT (40-50 words):
      - Mention current role/company.
      - ONE standout achievement with specific metric.
      - Link to their world.

      PART 3 - VALUE/INTEREST STATEMENT (40-50 words):
      - Specific interest in their company/role.
      - Reference something specific (news/research provided).
      - Show personalization.

      PART 4 - SOFT ASK + NEXT STEP (30-40 words):
      - Specific but easy question.
      - "Would you be open to..."
      - No big favors.

      TONE: ${input.tone}
      - Professional: Formal, complete sentences.
      - Warm Professional: Balanced, friendly but business-like.
      - Casual Confident: Conversational, shorter sentences.
      - Industry-Specific: Match the industry vibe.

      OUTPUT FORMAT:
      Return ONLY the message text, ready to send on LinkedIn.
      - No subject line
      - No signature block
      - Start with "Hi ${recruiterName || 'there'},"
      - Use line breaks between paragraphs.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate LinkedIn message.";
  } catch (err: unknown) {
    console.error("Error generating LinkedIn message:", err);
    throw new Error("Failed to generate LinkedIn message.");
  }
};

// 6. Generate Interview Prep Questions
export const generateInterviewQuestions = async (
  resumeText: string,
  jobInfo: JobInfo,
  existingQuestions: string[] = [],
  userLinks: { portfolio?: string; linkedin?: string } = {}
): Promise<InterviewQuestion[]> => {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    // Rate Limiting (Admin Exempt)
    const { data: currentRole } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (currentRole?.role !== 'admin') {
      await checkRateLimit(user.id, 'interviewPrep');
    }

    // Feature Usage Limit (3x per job)
    await checkFeatureLimit(supabase, user.id, jobInfo.id, 'interview_prep');

    // Sanitize
    const cleanResume = sanitizeText(resumeText, 50000);
    const cleanDesc = sanitizeText(jobInfo.description, 50000);
    const cleanTitle = sanitizeText(jobInfo.title, 500);
    const cleanCompany = sanitizeText(jobInfo.company, 200);
    const portfolioUrl = isValidUrl(userLinks?.portfolio) ? userLinks?.portfolio : "";
    const linkedinUrl = isValidUrl(userLinks?.linkedin) ? userLinks?.linkedin : "";

    const prompt = `
      You are an elite interview coach for senior-level Product and Data Product Management roles.

      Your goal is to generate interview preparation content that helps the candidate
      answer confidently and clearly in a live interview.

      JOB CONTEXT:
      Title: ${cleanTitle}
      Company: ${cleanCompany}
      Description: ${cleanDesc}

      CANDIDATE RESUME:
      ${cleanResume}

      CANDIDATE LINKS (for context):
      ${portfolioUrl ? `Portfolio: ${portfolioUrl}` : ''}
      ${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}

      INSTRUCTION: Use Google Search to verify or deepen your understanding of the candidate's background from their links (Portfolio/LinkedIn). Use this to generate more specific and challenging questions.

      EXISTING QUESTIONS (do not repeat):
      ${existingQuestions.join("; ")}

      STRICT RULES:
      1. Do NOT include internal reasoning, warnings, or AI commentary.
      2. Write as if the candidate will speak this answer out loud.
      3. Keep everything concise, natural, and senior-level.
      4. Do not invent metrics if they are not present in the resume.
      5. Avoid buzzwords, frameworks, or jargon-heavy explanations.
      6. If the resume lacks strong examples, prioritize clarity and credibility over impressiveness.

      FOR EACH QUESTION, RETURN AN OBJECT WITH:

      - id:
        A short unique string (e.g., "q1", "q2", etc.)

      - type:
        One of: Behavioral, Technical, Situational

      - question:
        A clear, interviewer-style question.

      - evaluationCriteria:
        An array of up to 4 bullets describing what the interviewer is testing.

      - answerStructure:
        An ordered array describing how to structure the answer.
        Use a concise STAR-like flow (Situation, Challenge, Actions, Outcome).

      - sampleAnswer:
        A first-person answer written in natural spoken language.
        2–3 short paragraphs.
        Confident, calm, and specific.
        No formatting, no bullet points.
        Mix and match context from Resume, Portfolio, and LinkedIn where relevant.

      - followUpQuestions:
        An array of exactly 2 realistic follow-up questions.

      OUTPUT REQUIREMENTS:
      - Return a JSON array
      - Generate exactly 5 questions
      - Mix Behavioral, Technical, and Situational questions
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Behavioral", "Technical", "Situational"] },
              question: { type: Type.STRING },
              evaluationCriteria: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                maxItems: 4
              },
              answerStructure: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                minItems: 3,
                maxItems: 5
              },
              sampleAnswer: { type: Type.STRING },
              followUpQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                minItems: 2,
                maxItems: 2
              }
            },
            required: [
              "id",
              "type",
              "question",
              "evaluationCriteria",
              "answerStructure",
              "sampleAnswer",
              "followUpQuestions"
            ]
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty interview prep response");

    return JSON.parse(jsonText) as InterviewQuestion[];
  } catch (err: unknown) {
    console.error("Error generating interview questions:", err);
    throw new Error("Failed to generate interview questions.");
  }
};

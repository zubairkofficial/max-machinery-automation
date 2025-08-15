// // src/ai/computeRescheduleViaLLM.ts
// import { ChatOpenAI } from "@langchain/openai";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { z } from "zod";
// import {
//   addBusinessDays,
//   isWeekend,
//   setHours, setMinutes, setSeconds, setMilliseconds,
// } from "date-fns";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { setHours, isWeekend, addBusinessDays, setMinutes } from "date-fns";
import { z } from "zod";

// /**
//  * LLM output schema (validated via Zod)
//  */
// const OutputSchema = z.object({
//   reschedule: z.boolean(),
//   scheduleText: z.string().nullable(),
//   // Raw target date if understood (before business-day adjustment)
//   targetDateISO: z.string().nullable(),
//   // 24-hour time if present, otherwise null
//   targetTime24h: z.string().nullable(),
//   // Business-day–adjusted ISO datetime (first business day 10:00 if no time)
//   businessAdjustedDateISO: z.string().nullable(),
//   // Calendar day difference from today (00:00 local) to target (00:00 local)
//   daysFromToday: z.number().nullable(),
//   // Business-day difference (Mon–Fri) from today to target
//   businessDaysFromToday: z.number().nullable(),
// });

// export type LLMReschedule = z.infer<typeof OutputSchema>;

// export async function computeRescheduleViaLLM(
//   scheduleText: string | null | undefined,
//   opts?: {
//     tz?: string;          // default Asia/Singapore
//     defaultHour?: number; // default 10
//     model?: string;       // default gpt-4o-mini
//     temperature?: number; // default 0
//   }
// ): Promise<Date | null> {
//   if (!scheduleText || !scheduleText.trim()) return null;

//   const tz = opts?.tz ?? "Asia/Singapore";
//   const defaultHour = opts?.defaultHour ?? 10;

//   const now = new Date();
//   const todayISO = new Intl.DateTimeFormat("en-CA", {
//     timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
//   }).format(now); // YYYY-MM-DD

//   // Build model with structured output
//   const llm = new ChatOpenAI({
//     modelName: opts?.model ?? "gpt-4o-mini",
//     temperature: opts?.temperature ?? 0,
//   }).withStructuredOutput(OutputSchema);

//   const prompt = ChatPromptTemplate.fromTemplate(
// `You are a scheduling normalizer. Given today's date and a free-text reschedule phrase,
// return a precise date with business-day adjustment in the timezone provided.

// Rules:
// - Timezone: {tz}
// - Today: {todayISO}
// - Month references:
//   - If only month is given ("jan", "feb", etc.), use first business day of next occurrence
//   - If month has passed this year, schedule for next year
// - Phrases to handle (case-insensitive, allow common typos):
//   - "next week" => next Monday
//   - "next month" / "next year" => first business day of that period at 10:00 local
//   - "in N days/weeks/months/years"
//   - Month names & common typos/short forms: jan, feb, mar, apr, may, jun, jul, aug,
//     sep/sept, oct, nov/novber, dec/desc/december
//   - If only a month is given (e.g., "Oct", "desc"), use first business day of that month at 10:00 local.
//   - If specific date/time is present (e.g., "Oct 12 3pm", "Friday 15:30"), use it (24-hour time).
//   - If the month has already passed this year, use the same month next year.
// - Business day = Monday–Friday. If the computed date lands on weekend, push to the next Monday 10:00 local.
// - Return both the raw target date (if inferred) and a business-day–adjusted ISO datetime.
// - Compute both calendar days and business days from today (00:00 local) to target (00:00 local). Integers only.

// Return ONLY a JSON object with fields:
// {{
//   "reschedule": boolean,
//   "scheduleText": string|null,
//   "targetDateISO": string|null,
//   "targetTime24h": string|null,
//   "businessAdjustedDateISO": string|null,
//   "daysFromToday": number|null,
//   "businessDaysFromToday": number|null
// }}

// scheduleText: "{scheduleText}"`
//   );

//   const res = await llm.invoke(await prompt.formatMessages({
//     tz, todayISO, scheduleText: scheduleText.trim(),
//   }));

//   // Safety: server-side validate business-day adjustment if provided
//   let finalISO = res.businessAdjustedDateISO ?? res.targetDateISO;
//   if (!finalISO) return null;

//   let d = new Date(finalISO);
//   if (isNaN(+d)) return null;

//   // Force default hour if no time component detected
//   if (/T00:00:00(\.000)?(Z|[+\-]\d{2}:\d{2})?$/.test(d.toISOString())) {
//     d = setDefaultTime(d, defaultHour);
//   }

//   // Weekend guard on server
//   if (isWeekend(d)) d = toNextBusinessDayAtDefaultTime(d, defaultHour);

//   return d;
// }

// function setDefaultTime(d: Date, hour: number) {
//   let x = setHours(d, hour);
//   x = setMinutes(x, 0);
//   x = setSeconds(x, 0);
//   x = setMilliseconds(x, 0);
//   return x;
// }

// function toNextBusinessDayAtDefaultTime(d: Date, hour: number) {
//   const bumped = addBusinessDays(d, 1);
//   return setDefaultTime(bumped, hour);
// }



export async function computeRescheduleDate(
    scheduleText: string,
    tz: string = 'America/New_York',
    defaultHour: number = 10
  ): Promise<Date | null> {
    const OutputSchema = z.object({
        scheduledDate: z.string() // ISO 8601 format with timezone
      });
    if (!scheduleText || !scheduleText.trim()) return null;
  
    // Get current date in target timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayISO = formatter.format(now);
  
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0
    }).withStructuredOutput(OutputSchema);
  
    const prompt = ChatPromptTemplate.fromTemplate(
  `You are a scheduling normalizer. Given today's date and a free-text reschedule phrase,
  return a precise date with business-day adjustment.
  
  Rules:
  - Timezone: {tz}
  - Today: {todayISO}
  - Month references:
    - If only month is given ("jan", "feb", etc.), use first business day of next occurrence
    - If month has passed this year, schedule for next year
  - Time handling:
    - Ignore time unless explicitly specified
    - Always use {defaultHour}:00 as default time
  - Relative terms:
    - "next week" = next Monday
    - "next month" = first business day of next month
    - "next year" = first business day of January next year
  - Business day adjustment:
    - If date falls on weekend, move to next Monday
    - Return date in ISO format with timezone offset
  
  Return ONLY JSON with:
  {{
    "scheduledDate": string // ISO 8601 format with timezone
  }}
  
  scheduleText: "{scheduleText}"`
    );
  
    try {
      const response = await llm.invoke(await prompt.formatMessages({
        tz,
        todayISO,
        scheduleText: scheduleText.trim(),
        defaultHour: String(defaultHour)
      }));
  
      const result = OutputSchema.parse(response);
      if (result.scheduledDate) {
        let d = new Date(result.scheduledDate);
        
        // Handle server-side validation
        if (isNaN(d.getTime())) return null;
        
        // Set default time if not specified
        if (d.getHours() === 0 && d.getMinutes() === 0) {
          d = setHours(d, defaultHour);
        }
        
        // Ensure business day
        if (isWeekend(d)) {
          d = addBusinessDays(d, 1);
          d = setHours(d, defaultHour);
          d = setMinutes(d, 0);
        }
        
        return d;
      }
    } catch (error) {
      this.logger.error(`LLM scheduling failed: ${error.message}`);
    }
    
    return null;
  }
  
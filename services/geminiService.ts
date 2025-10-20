import { GoogleGenAI, Type, type Chat, type Content } from "@google/genai";
import { SYSTEM_INSTRUCTION, ADVANCE_TIME_PROMPT } from '../constants';
import type { CameraEvent, CommsMessage, GeminiResponse } from '../types';
import type { MapArea } from "../data/mapData";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    events: {
      type: Type.ARRAY,
      description: "A list of 2 to 4 new surveillance events.",
      items: {
        type: Type.OBJECT,
        properties: {
          camera: {
            type: Type.STRING,
            description: "The location of the camera feed.",
          },
          timestamp: {
            type: Type.STRING,
            description: "The timestamp of the event, e.g., '23:17:04'.",
          },
          message: {
            type: Type.STRING,
            description: "A short, cryptic message describing the observation in Spanish. For corrupted events, this contains the corrupted snippet or tag.",
          },
          priority: {
            type: Type.STRING,
            description: "The priority of the event: 'LOW', 'MEDIUM', or 'HIGH'.",
          },
          personnel: {
            type: Type.ARRAY,
            description: "Array of key personnel involved. e.g., ['Dr. Aris Thorne']. Empty if none.",
            items: { type: Type.STRING }
          },
          anomalies: {
            type: Type.ARRAY,
            description: "Array of SCPs involved. e.g., ['SCP-173']. Empty if none.",
            items: { type: Type.STRING }
          },
          imageId: {
            type: Type.INTEGER,
            description: "Optional. An ID from 0 to 9 to attach a corresponding pre-set corrupted image to the event. Use for visually significant events.",
          },
          isCorrupted: {
            type: Type.BOOLEAN,
            description: "Optional. Set to true if the event data is corrupted and requires user intervention via SCRAM.exe."
          },
          corruptionType: {
            type: Type.STRING,
            description: "Optional. If isCorrupted is true, specify 'audio' or 'image'."
          },
          restoredMessage: {
            type: Type.STRING,
            description: "Optional. If isCorrupted is true, this field MUST contain the full, uncorrupted message that is revealed after using SCRAM.exe."
          }
        },
        required: ["camera", "timestamp", "message", "priority", "personnel", "anomalies"],
      },
    },
    messages: {
        type: Type.ARRAY,
        description: "Optional. A list of 0 to 2 new messages sent from personnel to the Supervisor.",
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "A unique random string ID for the message." },
                sender: { type: Type.STRING, description: "The name of the personnel sending the message." },
                recipient: { type: Type.STRING, description: "Should always be 'Supervisor'."},
                timestamp: { type: Type.STRING, description: "The timestamp of the message, e.g., '23:17:05'." },
                message: { type: Type.STRING, description: "The content of the message in Spanish." },
            },
            required: ["id", "sender", "recipient", "timestamp", "message"],
        }
    }
  },
  required: ["events"],
};


export const initializeChat = (history?: Content[]): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.9,
    },
  });
};

export const getNextEvents = async (chat: Chat, userAction?: string | null): Promise<{ events: CameraEvent[], messages: CommsMessage[] }> => {
  try {
    const prompt = userAction 
      ? `USER ACTION: ${userAction}\n${ADVANCE_TIME_PROMPT}`
      : ADVANCE_TIME_PROMPT;
      
    const response = await chat.sendMessage({ message: prompt });
    
    if (!response.text) {
        console.error("Gemini API returned an empty response text.");
        throw new Error("Received no data from IRIS.");
    }

    // Sanitize the response text before parsing
    const cleanedJsonString = response.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed: GeminiResponse = JSON.parse(cleanedJsonString);
    
    if (!parsed.events || !Array.isArray(parsed.events)) {
      console.error("Parsed JSON does not match expected schema:", parsed);
      throw new Error("Received malformed data from IRIS.");
    }
    
    // Also parse messages, defaulting to an empty array if not present
    const messages = (parsed.messages && Array.isArray(parsed.messages)) ? parsed.messages : [];

    return { events: parsed.events, messages };
  } catch (error) {
    console.error("Error fetching or parsing next events:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse surveillance data from IRIS. The data might be corrupted.");
    }
    throw error; // Re-throw other errors
  }
};